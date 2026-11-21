"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Cricket3DSceneProps {
  className?: string;
  isDark?: boolean;
}

export function Cricket3DScene({ className = "", isDark = true }: Cricket3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // WebGL capability check
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    // Three.js Scene Setup
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Procedural High-Resolution Cricket Leather Bump & Specular Texture
    const createLeatherTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Base leather tone
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Micro-pores and fine grain noise
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 36;
        data[i] = Math.min(255, Math.max(0, 128 + noise));
        data[i + 1] = Math.min(255, Math.max(0, 128 + noise));
        data[i + 2] = Math.min(255, Math.max(0, 128 + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      // Equator Seam Channel (Dark indentation grooves)
      const centerY = canvas.height / 2;
      ctx.fillStyle = "#202020";
      ctx.fillRect(0, centerY - 8, canvas.width, 16);

      // Raised Seam Cord Ridge (High relief)
      ctx.fillStyle = "#E0E0E0";
      ctx.fillRect(0, centerY - 4, canvas.width, 8);

      // Stitched Thread Indentations across seam
      ctx.strokeStyle = "#404040";
      ctx.lineWidth = 1.5;
      for (let x = 0; x < canvas.width; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, centerY - 10);
        ctx.lineTo(x + 6, centerY + 10);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    };

    const bumpMap = createLeatherTexture();

    // 1. The Cricket Ball Core (Sphere)
    const ballGeometry = new THREE.SphereGeometry(1.68, 64, 64);
    const ballMaterial = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x821212 : 0x8C1414, // Rich crimson cherry leather
      roughness: 0.28,
      metalness: 0.1,
      clearcoat: 0.75,
      clearcoatRoughness: 0.2,
      bumpMap: bumpMap || undefined,
      bumpScale: 0.035,
      reflectivity: 0.6,
    });

    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.rotation.z = THREE.MathUtils.degToRad(23.5); // Angled seam orientation
    ballMesh.rotation.y = THREE.MathUtils.degToRad(15);

    // 2. The Physical Raised Cricket Seam (Torus Ribbon)
    const seamGeometry = new THREE.TorusGeometry(1.685, 0.032, 16, 120);
    const seamMaterial = new THREE.MeshStandardMaterial({
      color: 0xF1EBDD, // Warm Ivory cotton thread
      roughness: 0.45,
      metalness: 0.05,
    });
    const seamMesh = new THREE.Mesh(seamGeometry, seamMaterial);
    seamMesh.rotation.x = Math.PI / 2;
    ballMesh.add(seamMesh);

    // 3. Stitched Seam Micro-Teeth (Detailed Relief)
    const stitchGroup = new THREE.Group();
    const stitchCount = 72;
    const stitchGeo = new THREE.BoxGeometry(0.018, 0.07, 0.035);
    const stitchMat = new THREE.MeshStandardMaterial({
      color: 0xFFFDF8,
      roughness: 0.35,
    });

    for (let i = 0; i < stitchCount; i++) {
      const angle = (i / stitchCount) * Math.PI * 2;
      const stitch = new THREE.Mesh(stitchGeo, stitchMat);
      stitch.position.set(
        Math.cos(angle) * 1.69,
        0,
        Math.sin(angle) * 1.69
      );
      stitch.rotation.y = -angle;
      stitch.rotation.z = i % 2 === 0 ? 0.35 : -0.35; // Criss-cross stitch
      stitchGroup.add(stitch);
    }
    ballMesh.add(stitchGroup);

    // Ball Group Holder for Compound Tilts
    const ballGroup = new THREE.Group();
    ballGroup.add(ballMesh);
    scene.add(ballGroup);

    // 4. Subtle Orbital Trajectory Ring (Fine Metallic Hairline)
    const ringGeo = new THREE.RingGeometry(2.15, 2.165, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF4B35,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    ringMesh.rotation.y = 0.2;
    scene.add(ringMesh);

    // 5. Ambient Atmospheric Dust Motes
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 6;
      particlePos[i + 1] = (Math.random() - 0.5) * 5;
      particlePos[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xF1EBDD,
      size: 0.025,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Three-Point Stadium Lighting Rig
    // Key Floodlight (Top-Left intense specular)
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Fill Light (Warm Ivory ambient bounce)
    const fillLight = new THREE.AmbientLight(0xF1EBDD, isDark ? 0.65 : 0.95);
    scene.add(fillLight);

    // Electric Vermilion Rim / Kick Light (Creating luxury silhouette halo)
    const vermilionRim = new THREE.PointLight(0xFF4B35, 3.8, 12);
    vermilionRim.position.set(-3.5, -2, -2.5);
    scene.add(vermilionRim);

    // Interactive Cursor Spotlight
    const cursorLight = new THREE.PointLight(0xF1EBDD, 1.2, 8);
    cursorLight.position.set(0, 0, 4);
    scene.add(cursorLight);

    // Pointer Interaction State
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotationY = x * 0.65;
      targetRotationX = -y * 0.45;

      cursorLight.position.x = x * 2.5;
      cursorLight.position.y = y * 2.5;
    };

    const handlePointerEnter = () => setIsInteracting(true);
    const handlePointerLeave = () => {
      setIsInteracting(false);
      targetRotationX = 0;
      targetRotationY = 0;
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("mouseenter", handlePointerEnter);
    container.addEventListener("mouseleave", handlePointerLeave);

    // Scroll Tracking
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = (currentScrollY - lastScrollY) * 0.002;
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 400;
      const newH = container.clientHeight || 420;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let isVisible = true;

    // Viewport Visibility optimization via IntersectionObserver
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    const startTime = performance.now();
    let lastTime = startTime;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsedTime = (now - startTime) / 1000;

      // Continuous Seam Spin
      if (!prefersReducedMotion) {
        ballMesh.rotation.y += (0.45 + scrollVelocity * 10) * delta;
        scrollVelocity *= 0.92; // Decay scroll impulse

        // Smooth Damped Mouse Lerping
        ballGroup.rotation.y += (targetRotationY - ballGroup.rotation.y) * 0.05;
        ballGroup.rotation.x += (targetRotationX - ballGroup.rotation.x) * 0.05;

        // Subtle Floating Oscillation
        ballGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
        ringMesh.rotation.z += 0.15 * delta;

        // Mote particles drift
        particles.rotation.y += 0.04 * delta;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("mouseenter", handlePointerEnter);
      container.removeEventListener("mouseleave", handlePointerLeave);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      ballGeometry.dispose();
      ballMaterial.dispose();
      seamGeometry.dispose();
      seamMaterial.dispose();
      stitchGeo.dispose();
      stitchMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  if (!hasWebGL) {
    // Elegant SVG / CSS Layered Fallback if WebGL is unavailable
    return (
      <div className={`relative flex items-center justify-center p-8 ${className}`}>
        <div className="w-56 h-56 rounded-full bg-gradient-to-br from-[#FF4B35] via-[#821212] to-[#111318] shadow-2xl relative overflow-hidden border border-white/20 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-[#F1EBDD]/40 rounded-full rotate-45 scale-105" />
          <span className="font-display font-black text-white text-2xl tracking-widest">EPL 3D</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[400px] sm:h-[460px] flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Precision Telemetry Badge Overlay */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none text-[10px] font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111318]/80 dark:bg-[#181A20]/80 border border-[#DDD5C3]/30 dark:border-[#2A2E38] backdrop-blur-md text-[#F1EBDD]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35] animate-pulse" />
          <span>REAL-TIME 3D SEAM PHYSICS</span>
        </div>
        <span className="text-[#8C867A] dark:text-[#A8A295] hidden sm:inline-block">
          {isInteracting ? "TRACKING POINTER" : "DRAG OR HOVER TO ROTATE"}
        </span>
      </div>
    </div>
  );
}
