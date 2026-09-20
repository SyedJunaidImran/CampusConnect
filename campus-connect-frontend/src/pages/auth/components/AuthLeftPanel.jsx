import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * AuthLeftPanel — Refined left panel for Login & Register pages.
 * Displays subtle CampusConnect branding, tailored narrative message,
 * and an ambient miniature 3D connection node visual.
 */
export default function AuthLeftPanel({
  eyebrow = 'ACADEMIC WORKSPACE',
  title = 'Intelligent Campus Infrastructure',
  description = 'Access your live timetables, coursework, attendance metrics, and departmental channels in one synchronized space.',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId = null;
    let renderer = null;
    let isDisposed = false;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initMiniScene(THREE) {
      if (isDisposed || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const width = canvas.parentElement?.clientWidth || 400;
      const height = canvas.parentElement?.clientHeight || 400;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 7.5);

      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
      } catch (e) {
        return;
      }

      // Group holding the 3D node lattice
      const nodeGroup = new THREE.Group();
      scene.add(nodeGroup);

      // Central abstract geometric icosahedron structure
      const icoGeo = new THREE.IcosahedronGeometry(2.1, 1);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.38,
      });
      const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(icoGeo), wireMat);
      nodeGroup.add(wireframe);

      // Inner glowing core
      const coreGeo = new THREE.SphereGeometry(0.75, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        transparent: true,
        opacity: 0.25,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      nodeGroup.add(coreMesh);

      // Floating vertex nodes
      const pos = icoGeo.attributes.position;
      const vertexCount = pos.count;
      for (let i = 0; i < vertexCount; i += 3) {
        const dotGeo = new THREE.SphereGeometry(0.065, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xc7d2fe });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        nodeGroup.add(dot);
      }

      // Lighting
      const light = new THREE.PointLight(0x818cf8, 2, 10);
      light.position.set(2, 2, 3);
      scene.add(light);

      const animate = () => {
        if (isDisposed) return;
        animId = requestAnimationFrame(animate);

        if (!prefersReducedMotion) {
          nodeGroup.rotation.y += 0.003;
          nodeGroup.rotation.x += 0.0015;
        }

        renderer.render(scene, camera);
      };

      animate();
    }

    if (window.THREE) {
      initMiniScene(window.THREE);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => {
        if (window.THREE && !isDisposed) {
          initMiniScene(window.THREE);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <aside className="auth-split-left" aria-label="CampusConnect Branding">
      <div className="auth-left-glow" />

      {/* Top Logo */}
      <Link to="/" className="auth-left-logo">
        <span className="landing-nav-logo-dot" />
        CampusConnect
      </Link>

      {/* 3D Visual Centerpiece */}
      <div className="auth-left-canvas-wrap">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Narrative Message */}
      <div className="auth-left-message">
        <span className="auth-left-eyebrow">{eyebrow}</span>
        <h2 className="auth-left-title">{title}</h2>
        <p className="auth-left-desc">{description}</p>
      </div>

      {/* Footer info */}
      <div className="auth-left-footer">
        <span>© {new Date().getFullYear()} CampusConnect</span>
        <span>Role-Segmented JWT Protocol</span>
      </div>
    </aside>
  );
}
