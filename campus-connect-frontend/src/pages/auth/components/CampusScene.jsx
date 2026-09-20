import React, { useEffect, useRef } from 'react';

/**
 * CampusScene — Interactive 3D Digital Campus Architecture Centerpiece.
 *
 * Renders an elegant abstract 3D campus structure:
 * - Monolithic architectural towers with matte dark finish & subtle edge highlights
 * - Elevated ground grid with delicate concentric coordinate rings
 * - Glowing network connections and pulsing data packets in brand indigo (#6366f1)
 * - Drifting ambient activity particles
 * - Smooth mouse-driven parallax and slow ambient rotation
 * - Zero heavy dependencies (uses Three.js via window.THREE or dynamic CDN)
 * - Respects prefers-reduced-motion
 */
export default function CampusScene() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let isDisposed = false;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initThree(THREE) {
      if (isDisposed || !canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      let width = container.clientWidth || window.innerWidth * 0.55;
      let height = container.clientHeight || window.innerHeight;

      // 1. Scene setup
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x08080c, 0.022);

      // 2. Camera setup
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      const initialCamPos = { x: 13.5, y: 11.5, z: 14.5 };
      camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
      camera.lookAt(0, 1.8, 0);

      // 3. Renderer setup
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x08080c, 0);
      } catch (e) {
        console.warn('WebGL initialization fallback', e);
        return;
      }

      // 4. Lighting
      const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.1);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xf8fafc, 1.5);
      dirLight.position.set(18, 26, 14);
      scene.add(dirLight);

      const secondaryLight = new THREE.DirectionalLight(0x6366f1, 0.8);
      secondaryLight.position.set(-15, 12, -10);
      scene.add(secondaryLight);

      const centralPointLight = new THREE.PointLight(0x818cf8, 3.5, 20);
      centralPointLight.position.set(0, 3.5, 0);
      scene.add(centralPointLight);

      // 5. Architectural Ground Platform
      const gridHelper = new THREE.GridHelper(22, 22, 0x4f46e5, 0x181826);
      gridHelper.position.y = -0.01;
      if (gridHelper.material) {
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.25;
      }
      scene.add(gridHelper);

      // Concentric coordinate rings
      const ringGeo = new THREE.RingGeometry(3.5, 11, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -0.02;
      scene.add(ringMesh);

      // 6. Monolithic Architectural Campus Towers
      const campusGroup = new THREE.Group();
      scene.add(campusGroup);

      const buildingConfigs = [
        { x: 0, z: 0, w: 2.3, d: 2.3, h: 6.2, label: 'Central Hub' },
        { x: -3.8, z: -1.2, w: 1.8, d: 1.6, h: 4.4, label: 'Science & Labs' },
        { x: 3.6, z: -2.0, w: 1.9, d: 2.1, h: 5.0, label: 'Library & Records' },
        { x: -2.5, z: 3.2, w: 1.6, d: 1.8, h: 3.6, label: 'Faculty Hall' },
        { x: 3.3, z: 2.8, w: 1.7, d: 1.7, h: 4.0, label: 'Analytics' },
        { x: -4.6, z: 2.0, w: 1.4, d: 1.4, h: 2.9, label: 'Student Center' },
        { x: 1.2, z: -4.3, w: 1.5, d: 1.5, h: 3.3, label: 'Academic Archive' },
      ];

      const buildingTops = [];

      buildingConfigs.forEach((cfg) => {
        const boxGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0x0f0f18,
          roughness: 0.35,
          metalness: 0.7,
        });
        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.position.set(cfg.x, cfg.h / 2, cfg.z);
        campusGroup.add(mesh);

        // Crisp beveled edge wireframe highlight
        const edges = new THREE.EdgesGeometry(boxGeo);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x6366f1,
          transparent: true,
          opacity: 0.45,
        });
        const line = new THREE.LineSegments(edges, lineMat);
        mesh.add(line);

        // Roof node beacon
        const nodeGeo = new THREE.SphereGeometry(0.13, 16, 16);
        const nodeMat = new THREE.MeshBasicMaterial({
          color: 0x818cf8,
          transparent: true,
          opacity: 0.95,
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.set(cfg.x, cfg.h + 0.15, cfg.z);
        campusGroup.add(nodeMesh);

        buildingTops.push(new THREE.Vector3(cfg.x, cfg.h + 0.15, cfg.z));
      });

      // 7. Glowing Interconnected Network Lines
      const connectionsGroup = new THREE.Group();
      scene.add(connectionsGroup);

      const packetData = [];

      const pairs = [
        [0, 1], [0, 2], [0, 3], [0, 4],
        [1, 3], [2, 4], [1, 5], [2, 6], [3, 5], [4, 6]
      ];

      pairs.forEach(([fromIdx, toIdx], pairIndex) => {
        const p1 = buildingTops[fromIdx];
        const p2 = buildingTops[toIdx];

        const midPoint = new THREE.Vector3()
          .addVectors(p1, p2)
          .multiplyScalar(0.5);
        midPoint.y += 0.85 + (pairIndex % 3) * 0.3;

        const curve = new THREE.CatmullRomCurve3([p1, midPoint, p2]);
        const points = curve.getPoints(32);
        const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

        const curveMat = new THREE.LineBasicMaterial({
          color: 0x6366f1,
          transparent: true,
          opacity: 0.35,
        });
        const curveLine = new THREE.Line(curveGeo, curveMat);
        connectionsGroup.add(curveLine);

        // Pulsing data packet along network curve
        const packetGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const packetMat = new THREE.MeshBasicMaterial({ color: 0xc7d2fe });
        const packetMesh = new THREE.Mesh(packetGeo, packetMat);
        connectionsGroup.add(packetMesh);

        packetData.push({
          mesh: packetMesh,
          curve,
          speed: 0.003 + (pairIndex * 0.0007),
          progress: (pairIndex * 0.14) % 1,
        });
      });

      // 8. Drifting Activity Particles
      const particleCount = 75;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = [];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = Math.random() * 8.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
        velocities.push({
          y: 0.005 + Math.random() * 0.012,
          drift: (Math.random() - 0.5) * 0.004,
        });
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x818cf8,
        size: 0.085,
        transparent: true,
        opacity: 0.55,
      });
      const particleSystem = new THREE.Points(particleGeo, particleMat);
      scene.add(particleSystem);

      // 9. Parallax & Mouse tracking
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;
      let scrollY = 0;

      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };

      const handleScroll = () => {
        scrollY = window.scrollY || window.pageYOffset;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });

      // 10. Resize handling
      const handleResize = () => {
        if (!containerRef.current || !renderer || !camera) return;
        width = containerRef.current.clientWidth || window.innerWidth * 0.55;
        height = containerRef.current.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      // 11. Animation Loop
      const animate = () => {
        if (isDisposed) return;
        animId = requestAnimationFrame(animate);

        if (!prefersReducedMotion) {
          // Slow ambient turntable rotation
          campusGroup.rotation.y += 0.0011;
          connectionsGroup.rotation.y += 0.0011;
          gridHelper.rotation.y += 0.0011;
          ringMesh.rotation.z += 0.0011;

          // Pulse data packets along network paths
          packetData.forEach((pkt) => {
            pkt.progress = (pkt.progress + pkt.speed) % 1;
            const pt = pkt.curve.getPoint(pkt.progress);
            pkt.mesh.position.copy(pt);
          });

          // Drift particles upward
          const posAttr = particleGeo.attributes.position;
          const posArray = posAttr.array;
          for (let i = 0; i < particleCount; i++) {
            posArray[i * 3 + 1] += velocities[i].y;
            posArray[i * 3] += velocities[i].drift;

            if (posArray[i * 3 + 1] > 9) {
              posArray[i * 3 + 1] = 0;
              posArray[i * 3] = (Math.random() - 0.5) * 15;
              posArray[i * 3 + 2] = (Math.random() - 0.5) * 15;
            }
          }
          posAttr.needsUpdate = true;
        }

        // Smooth mouse parallax lerp
        targetX += (mouseX * 1.6 - targetX) * 0.04;
        targetY += (mouseY * 1.1 - targetY) * 0.04;

        // Subtle scroll glide
        const scrollFactor = Math.min(scrollY * 0.0018, 1.2);

        camera.position.x = initialCamPos.x + targetX;
        camera.position.y = initialCamPos.y + targetY - scrollFactor * 2;
        camera.position.z = initialCamPos.z - scrollFactor;
        camera.lookAt(0, 1.8 - scrollFactor * 0.5, 0);

        renderer.render(scene, camera);
      };

      animate();
    }

    if (window.THREE) {
      initThree(window.THREE);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => {
        if (window.THREE && !isDisposed) {
          initThree(window.THREE);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', () => {});
      window.removeEventListener('mousemove', () => {});
      window.removeEventListener('scroll', () => {});
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div className="hero-canvas" ref={containerRef} aria-hidden="true">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
