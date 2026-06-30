/* ============================================================
   A28 Global — deliver3d.js  (government home only)
   "How We Deliver" — a 3D delivery loop ported from the v3
   loop3d concept: a wireframe icosahedron core, a glowing inner
   core, and three tilted torus rings with travelling node
   spheres. Recoloured to the gov "mission" gold palette.

   Each of the four delivery-phase text boxes is a canvas-textured
   plane ATTACHED TO A TRAVELLING ATOM — one box per node — so the
   boxes ride their own orbit and move independently. Box positions
   follow their atom's world position each frame (so they rotate
   with the whole model when you drag), while each box billboards
   toward the camera so the copy stays readable as it flies around.

   Classic script (no ES modules) so it also runs from file://.
   Expects the global THREE (UMD r128) loaded before this file.
   Reads its copy from the hidden #deliver-labels markup, so the
   text lives once in the DOM (texture source + screen readers).
   ============================================================ */
(function () {
  "use strict";

  var container = document.getElementById("deliver-loop3d");
  if (!container) return;

  // Only run on the active route (gov markup is hidden on enterprise).
  var activeTheme = document.documentElement.getAttribute("data-theme");
  var wrapper = container.closest("[data-theme-only]");
  if (wrapper && wrapper.getAttribute("data-theme-only") !== activeTheme) return;
  if (!window.THREE) { container.classList.add("loop-fallback"); return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var accent  = new THREE.Color(container.getAttribute("data-accent")  || "#C2912E");
  var accent2 = new THREE.Color(container.getAttribute("data-accent2") || "#E8B864");
  var coreCol = new THREE.Color(container.getAttribute("data-core")    || "#E9E4D6");

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (e) {
    container.classList.add("loop-fallback");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7.8);

  var group = new THREE.Group();
  scene.add(group);

  /* --- wireframe core + glowing inner core --- */
  var core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.74, 1),
    new THREE.MeshBasicMaterial({ color: coreCol, wireframe: true, transparent: true, opacity: 0.42 })
  );
  group.add(core);
  var coreGlow = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.40, 1),
    new THREE.MeshBasicMaterial({ color: accent2, transparent: true, opacity: 0.85 })
  );
  group.add(coreGlow);

  /* --- delivery-phase copy (texture source) --- */
  var steps = Array.prototype.map.call(
    document.querySelectorAll("#deliver-labels .deliver-label"),
    function (el) {
      var pick = function (s) { var n = el.querySelector(s); return n ? n.textContent.trim() : ""; };
      return { num: pick(".deliver-label__num"), title: pick(".deliver-label__title"), body: pick("p") };
    }
  );

  var BW = 2.4, BH = 1.42;            // box plane size (world units)
  var planes = [];

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function wrapText(c, text, x, y, maxW, lh) {
    var words = text.split(" "), line = "", yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + " ";
      if (c.measureText(test).width > maxW && line) { c.fillText(line.trim(), x, yy); line = words[i] + " "; yy += lh; }
      else line = test;
    }
    c.fillText(line.trim(), x, yy);
  }

  function makeTexture(step) {
    var dpr = Math.min(window.devicePixelRatio, 2);
    var W = 780, H = Math.round(W * BH / BW);
    var cv = document.createElement("canvas");
    cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext("2d");
    c.scale(dpr, dpr);

    // panel: noir-soft fill + gold border (matches gov pop-up cards)
    c.fillStyle = "rgba(22, 20, 27, 0.94)";
    roundRect(c, 7, 7, W - 14, H - 14, 28); c.fill();
    c.lineWidth = 4; c.strokeStyle = "rgba(194, 145, 46, 0.92)";
    roundRect(c, 7, 7, W - 14, H - 14, 28); c.stroke();

    var pad = 52;
    c.textBaseline = "top";
    // eyebrow — JetBrains Mono, gold-glow
    c.fillStyle = "#E8B864";
    c.font = '600 30px "JetBrains Mono", monospace';
    c.fillText((step.num || "").toUpperCase(), pad, pad);
    // title — Oranienbaum, bone
    c.fillStyle = "#F5F5EB";
    c.font = '400 60px "Oranienbaum", serif';
    c.fillText(step.title || "", pad, pad + 44);
    // body — Inter, bone-soft (wrapped)
    c.fillStyle = "rgba(245, 245, 235, 0.80)";
    c.font = '400 29px "Inter", sans-serif';
    wrapText(c, step.body || "", pad, pad + 134, W - pad * 2, 40);

    var tex = new THREE.CanvasTexture(cv);
    if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    tex.needsUpdate = true;
    return tex;
  }

  function makeBox(step) {
    var mat = new THREE.MeshBasicMaterial({
      map: makeTexture(step), transparent: true, side: THREE.DoubleSide, depthWrite: false
    });
    var box = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), mat);
    box.renderOrder = 10;             // draw on top of rings/core
    scene.add(box);                   // in scene, not group → billboard freely
    planes.push({ mesh: box, step: step });
    return box;
  }

  /* --- tilted orbit rings + travelling nodes (one text box per node) --- */
  var ORBITS = [
    { tilt: [Math.PI / 2, 0, 0],                r: 2.05, speed: 0.17,  nodes: 2 },
    { tilt: [Math.PI / 2.6, 0, Math.PI / 3],    r: 2.5,  speed: -0.13, nodes: 1 },
    { tilt: [Math.PI / 1.7, 0, -Math.PI / 3.2], r: 2.85, speed: 0.10,  nodes: 1 }
  ];
  var movers = [];
  var stepIdx = 0;
  ORBITS.forEach(function (o, i) {
    var ringHolder = new THREE.Group();
    ringHolder.rotation.set(o.tilt[0], o.tilt[1], o.tilt[2]);
    group.add(ringHolder);

    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(o.r, 0.007, 8, 140),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 })
    );
    ringHolder.add(ring);

    for (var n = 0; n < o.nodes; n++) {
      var node = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 14, 14),
        new THREE.MeshBasicMaterial({ color: accent2 })
      );
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 14, 14),
        new THREE.MeshBasicMaterial({ color: accent2, transparent: true, opacity: 0.18 })
      );
      node.add(halo);
      ringHolder.add(node);
      var box = stepIdx < steps.length ? makeBox(steps[stepIdx]) : null;
      movers.push({ node: node, r: o.r, speed: o.speed, phase: (n / o.nodes) * Math.PI * 2 + i * 1.3, box: box });
      stepIdx++;
    }
  });

  // Fonts may not be ready on first paint; redraw the textures once they are.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      planes.forEach(function (p) {
        var old = p.mesh.material.map;
        p.mesh.material.map = makeTexture(p.step);
        p.mesh.material.needsUpdate = true;
        if (old) old.dispose();
      });
    });
  }

  /* --- drag to rotate --- */
  var dragging = false, lastX = 0, lastY = 0;
  var tY = 0.45, tX = 0.14, idleVel = 0.0016;
  container.style.touchAction = "pan-y";
  container.style.cursor = "grab";
  container.addEventListener("pointerdown", function (ev) {
    dragging = true; lastX = ev.clientX; lastY = ev.clientY;
    container.style.cursor = "grabbing";
    container.setPointerCapture(ev.pointerId);
    container.classList.add("is-dragged");
  });
  container.addEventListener("pointermove", function (ev) {
    if (!dragging) return;
    tY += (ev.clientX - lastX) * 0.006;
    tX = Math.max(-0.95, Math.min(0.95, tX + (ev.clientY - lastY) * 0.004));
    lastX = ev.clientX; lastY = ev.clientY;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (evn) {
    container.addEventListener(evn, function () { dragging = false; container.style.cursor = "grab"; });
  });

  function size() {
    var w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  size();
  if (window.ResizeObserver) new ResizeObserver(size).observe(container);
  else window.addEventListener("resize", size);

  var visible = true;
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.02 })
    .observe(container);

  var tmp = new THREE.Vector3();
  function setNodes(t) {
    movers.forEach(function (m) {
      var a = t * m.speed + m.phase;
      m.node.position.set(Math.cos(a) * m.r, Math.sin(a) * m.r, 0);
    });
  }
  // Pin each label to its atom's world position; billboard it toward the camera.
  function placeBoxes() {
    group.updateWorldMatrix(true, true);
    movers.forEach(function (m) {
      if (!m.box) return;
      m.node.getWorldPosition(tmp);
      m.box.position.copy(tmp);
      m.box.position.y += 0.1;                  // float just above the atom
      m.box.quaternion.copy(camera.quaternion);
    });
  }

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    var t = clock.getElapsedTime();
    if (!dragging && !reduced) tY += idleVel;
    group.rotation.y += (tY - group.rotation.y) * 0.07;
    group.rotation.x += (tX - group.rotation.x) * 0.07;
    if (!reduced) {
      core.rotation.y = t * 0.25;
      core.rotation.x = t * 0.12;
      coreGlow.scale.setScalar(1 + Math.sin(t * 1.8) * 0.12);
      setNodes(t);
    }
    placeBoxes();
    renderer.render(scene, camera);
  }
  if (reduced) {
    group.rotation.y = tY; group.rotation.x = tX;
    setNodes(0); placeBoxes();
    renderer.render(scene, camera);
    container.addEventListener("pointermove", function () {
      group.rotation.y = tY; group.rotation.x = tX;
      placeBoxes();
      renderer.render(scene, camera);
    });
  } else {
    frame();
  }
  container.classList.add("loop-ready");
})();
