import * as THREE from '../vendor/three.module.js';

const mounts = document.querySelectorAll('[data-three-hero]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

mounts.forEach((mount) => {
  let scene;
  let camera;
  let renderer;
  let frameId;
  let root;
  let rings = [];
  let satellites = [];
  let particles;
  const pointer = { x: 0, y: 0 };

  const clock = new THREE.Clock();

  const init = () => {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.35, 5.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    mount.appendChild(renderer.domElement);
    mount.classList.add('is-loaded');

    buildScene();
    resize();
    animate();
  };

  const buildScene = () => {
    root = new THREE.Group();
    root.position.y = 0.06;
    scene.add(root);

    // Central lens core, built procedurally from primitives.
    const lensGroup = new THREE.Group();

    const lensGeo = new THREE.SphereGeometry(0.9, 72, 72);
    lensGeo.scale(1.24, 0.5, 1.24);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x89b9ff,
      metalness: 0.02,
      roughness: 0.08,
      transmission: 0.94,
      thickness: 1.2,
      ior: 1.45,
      reflectivity: 0.9,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      emissive: 0x0f1f4a,
      emissiveIntensity: 0.45,
    });
    const lensCore = new THREE.Mesh(lensGeo, lensMat);
    lensGroup.add(lensCore);

    const rimGeo = new THREE.TorusGeometry(1.27, 0.08, 24, 180);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x6cd8ff,
      metalness: 0.82,
      roughness: 0.18,
      emissive: 0x2ecae2,
      emissiveIntensity: 0.16,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    lensGroup.add(rim);

    const capGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.12, 48);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0c172f, metalness: 0.9, roughness: 0.22 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = -0.4;
    lensGroup.add(cap);

    root.add(lensGroup);

    const ringMatA = new THREE.MeshStandardMaterial({
      color: 0x4be2f1,
      metalness: 0.86,
      roughness: 0.22,
      emissive: 0x0f6cd8,
      emissiveIntensity: 0.2,
    });
    const ringMatB = new THREE.MeshStandardMaterial({
      color: 0x4f7fff,
      metalness: 0.86,
      roughness: 0.22,
      emissive: 0x1abfcf,
      emissiveIntensity: 0.14,
    });

    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.026, 16, 220), ringMatA);
    ringA.rotation.set(Math.PI / 2.3, 0, 0.23);
    root.add(ringA);

    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.03, 16, 220), ringMatB);
    ringB.rotation.set(0.34, Math.PI / 2.6, -0.18);
    root.add(ringB);

    const ringC = new THREE.Mesh(new THREE.TorusGeometry(2.52, 0.02, 14, 200), ringMatA);
    ringC.rotation.set(0.1, 0.7, 1.35);
    root.add(ringC);

    rings = [ringA, ringB, ringC];

    const panelGeo = new THREE.BoxGeometry(0.55, 0.11, 0.3);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1d355f,
      metalness: 0.78,
      roughness: 0.24,
      emissive: 0x1f9ef8,
      emissiveIntensity: 0.14,
    });
    const nodeGeo = new THREE.SphereGeometry(0.09, 18, 18);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x7fefff,
      emissive: 0x2dd9f0,
      emissiveIntensity: 0.52,
      metalness: 0.42,
      roughness: 0.3,
    });

    for (let i = 0; i < 8; i += 1) {
      const orbit = new THREE.Group();
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2.26;
      orbit.position.set(Math.cos(angle) * radius, (i % 2 === 0 ? 0.26 : -0.24), Math.sin(angle) * radius);
      orbit.lookAt(0, 0, 0);

      const panel = new THREE.Mesh(panelGeo, panelMat);
      orbit.add(panel);

      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(0, 0.12, 0.18);
      orbit.add(node);

      root.add(orbit);
      satellites.push(orbit);
    }

    const particleCount = 260;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      const radius = THREE.MathUtils.randFloat(2.7, 4.1);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.46;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.9, 0.6);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMat = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    particles = new THREE.Points(pointsGeo, pointsMat);
    root.add(particles);

    const ambient = new THREE.AmbientLight(0x7abfff, 0.62);
    scene.add(ambient);

    const key = new THREE.PointLight(0x6cb8ff, 2.1, 16, 2.2);
    key.position.set(2.8, 2.6, 2.2);
    scene.add(key);

    const fill = new THREE.PointLight(0x2ef2dd, 1.8, 14, 2.1);
    fill.position.set(-3.1, -2.2, 1.3);
    scene.add(fill);

    const back = new THREE.PointLight(0x4f6fff, 1.1, 12, 2);
    back.position.set(0, 0.8, -4.2);
    scene.add(back);
  };

  const resize = () => {
    const { clientWidth, clientHeight } = mount;
    if (!clientWidth || !clientHeight) return;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
  };

  const animate = () => {
    const t = clock.getElapsedTime();

    const px = pointer.x * 0.24;
    const py = pointer.y * 0.18;

    root.rotation.y = t * 0.22 + px;
    root.rotation.x = 0.08 + Math.sin(t * 0.6) * 0.04 + py;

    rings[0].rotation.z = t * 0.55;
    rings[1].rotation.x = t * 0.47;
    rings[2].rotation.y = -t * 0.35;

    satellites.forEach((sat, i) => {
      sat.rotation.y = t * (0.4 + i * 0.018);
      sat.rotation.z = Math.sin(t * 1.4 + i) * 0.22;
    });

    particles.rotation.y = -t * 0.05;
    particles.rotation.x = Math.sin(t * 0.3) * 0.08;

    renderer.render(scene, camera);

    if (!reducedMotion) {
      frameId = requestAnimationFrame(animate);
    }
  };

  const onPointerMove = (event) => {
    const rect = mount.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    pointer.x = (nx - 0.5) * 2;
    pointer.y = -(ny - 0.5) * 2;
  };

  const onPointerLeave = () => {
    pointer.x *= 0.3;
    pointer.y *= 0.3;
  };

  try {
    init();
    mount.addEventListener('pointermove', onPointerMove, { passive: true });
    mount.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
  } catch (err) {
    // Keep fallback content visible if WebGL init fails.
    // eslint-disable-next-line no-console
    console.warn('3D hero init failed:', err);
  }

  if (reducedMotion && renderer) {
    renderer.render(scene, camera);
    cancelAnimationFrame(frameId);
  }
});
