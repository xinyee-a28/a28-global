/* ============================================================
   A28 Global — globe3d.js  (government home hero background)
   Ported from the v3 "data globe": a gold dotted sphere with a
   faint lat/long cage, an equator ring, and arcs out of Kuala
   Lumpur to world cities — each with a travelling pulse and a
   destination node, plus a pulsing HQ beacon.

   Differences from v3: it lives BEHIND the hero content as a
   right-side background, it is NON-INTERACTIVE (no drag — idle
   auto-rotation only; pointer-events are disabled in CSS), and
   the camera is pulled back so the whole globe + arcs sit inside
   the frame with no clipping. Recoloured to the gov gold tokens.

   Classic script (no ES modules) so it also runs from file://.
   Expects the global THREE (UMD r128) loaded before this file.
   ============================================================ */
(function () {
  "use strict";
  if (document.documentElement.getAttribute("data-theme") !== "government") return;
  var container = document.querySelector("[data-globe]");
  if (!container) return;
  if (!window.THREE) { container.classList.add("globe-fallback"); return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GOLD        = new THREE.Color(container.getAttribute("data-color")  || "#C2912E");
  var GOLD_BRIGHT = new THREE.Color(container.getAttribute("data-color2") || "#E8B864");
  var BONE        = new THREE.Color(container.getAttribute("data-core")   || "#E9E4D6");

  function latLon(lat, lon, r) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (e) {
    container.classList.add("globe-fallback");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  var scene = new THREE.Scene();
  // FOV 38; distance 7.8 (v3 used 6.2) — close enough that the globe fills the
  // tall container, far enough that the sphere + ring stay fully framed.
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0.25, 7.8);

  var globe = new THREE.Group();
  scene.add(globe);
  globe.rotation.z = -0.16; /* axial tilt */

  /* --- dotted sphere (fibonacci distribution) --- */
  var R = 2;
  var COUNT = 1600;
  var pos = new Float32Array(COUNT * 3);
  var golden = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < COUNT; i++) {
    var y = 1 - (i / (COUNT - 1)) * 2;
    var rad = Math.sqrt(1 - y * y);
    var th = golden * i;
    pos[i * 3] = Math.cos(th) * rad * R;
    pos[i * 3 + 1] = y * R;
    pos[i * 3 + 2] = Math.sin(th) * rad * R;
  }
  var dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var dots = new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: GOLD, size: 0.028, transparent: true, opacity: 0.8, sizeAttenuation: true
  }));
  globe.add(dots);

  /* faint lat/long cage */
  var cage = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.995, 24, 16),
    new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.07 })
  );
  globe.add(cage);

  /* equator ring accent */
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(R * 1.18, 0.006, 8, 120),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.38 })
  );
  ring.rotation.x = Math.PI / 2 - 0.28;
  globe.add(ring);

  /* --- arcs out of Kuala Lumpur --- */
  var KL = { lat: 3.14, lon: 101.69 };
  var targets = [
    { lat: 1.35, lon: 103.8 },   /* Singapore */
    { lat: 25.2, lon: 55.27 },   /* Dubai */
    { lat: 35.68, lon: 139.69 }, /* Tokyo */
    { lat: 51.5, lon: -0.12 },   /* London */
    { lat: -33.87, lon: 151.2 }, /* Sydney */
    { lat: 24.71, lon: 46.67 },  /* Riyadh */
    { lat: 37.57, lon: 126.98 }  /* Seoul */
  ];
  var arcGroup = new THREE.Group();
  globe.add(arcGroup);
  var pulses = [];
  var from = latLon(KL.lat, KL.lon, R);

  targets.forEach(function (t, idx) {
    var to = latLon(t.lat, t.lon, R);
    // bulge factor 0.33 (v3 = 0.38) — slightly flatter arcs so even the
    // longest (London / Sydney) stay inside the pulled-back frame.
    var mid = from.clone().add(to).multiplyScalar(0.5).normalize()
      .multiplyScalar(R + from.distanceTo(to) * 0.33);
    var curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    var geo = new THREE.TubeGeometry(curve, 48, 0.0065, 6, false);
    var mat = new THREE.MeshBasicMaterial({ color: GOLD_BRIGHT, transparent: true, opacity: 0.5 });
    arcGroup.add(new THREE.Mesh(geo, mat));

    /* travelling pulse */
    var p = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 10),
      new THREE.MeshBasicMaterial({ color: BONE, transparent: true })
    );
    p.userData = { curve: curve, offset: idx / targets.length };
    pulses.push(p);
    arcGroup.add(p);

    /* destination node */
    var node = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 10, 10),
      new THREE.MeshBasicMaterial({ color: GOLD_BRIGHT })
    );
    node.position.copy(to);
    arcGroup.add(node);
  });

  /* HQ beacon */
  var beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    new THREE.MeshBasicMaterial({ color: GOLD_BRIGHT })
  );
  beacon.position.copy(from);
  arcGroup.add(beacon);

  /* --- idle auto-rotation only (NO drag) --- */
  var velY = 0.0024;
  var targetRotY = 0.6, targetRotX = 0.08;

  /* --- sizing --- */
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

  /* --- render loop, paused off-screen --- */
  var visible = true;
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.02 })
    .observe(container);

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    var t = clock.getElapsedTime();
    if (!reduced) targetRotY += velY;
    globe.rotation.y += (targetRotY - globe.rotation.y) * 0.08;
    globe.rotation.x += (targetRotX - globe.rotation.x) * 0.08;
    if (!reduced) {
      pulses.forEach(function (p) {
        var u = (t * 0.12 + p.userData.offset) % 1;
        p.position.copy(p.userData.curve.getPoint(u));
        p.material.opacity = Math.sin(u * Math.PI);
      });
      var s = 1 + Math.sin(t * 2.2) * 0.25;
      beacon.scale.setScalar(s);
    }
    renderer.render(scene, camera);
  }
  if (reduced) {
    globe.rotation.y = targetRotY;
    globe.rotation.x = targetRotX;
    pulses.forEach(function (p) { p.position.copy(p.userData.curve.getPoint(p.userData.offset)); });
    renderer.render(scene, camera);
  } else {
    frame();
  }
  container.classList.add("globe-ready");
})();
