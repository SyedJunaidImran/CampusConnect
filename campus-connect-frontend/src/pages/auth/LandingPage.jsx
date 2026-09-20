import React, { useEffect } from 'react';
import LandingNav from './components/LandingNav';
import HeroSection from './components/HeroSection';
import CampusScene from './components/CampusScene';
import CapabilitiesSection from './components/CapabilitiesSection';
import AboutContactSection from './components/AboutContactSection';
import '../../styles/auth.css';

/**
 * LandingPage — Premium, Minimalist, 3D Product Website for CampusConnect.
 *
 * Structure:
 * 1. Minimal Navigation (Logo, Features, About, Contact, Sign In, Get Started)
 * 2. Hero Section ("Your Campus, Connected.", dual CTAs) + 3D Centerpiece Canvas
 * 3. Capabilities Section ("Everything your campus needs, connected." — 4 capabilities)
 * 4. About & Contact Section + Minimal Footer
 */
export default function LandingPage() {
  useEffect(() => {
    // Subtle IntersectionObserver for scroll-reveal animations
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing">
      {/* 1. Minimal Navigation */}
      <LandingNav />

      {/* 2. Hero Section + 3D Digital Campus Architecture */}
      <div style={{ position: 'relative' }}>
        <HeroSection />
        <CampusScene />
      </div>

      {/* 3. "Everything your campus needs, connected." — 4 Capabilities */}
      <CapabilitiesSection />

      {/* 4. About & Contact + Minimal Footer */}
      <AboutContactSection />
    </div>
  );
}
