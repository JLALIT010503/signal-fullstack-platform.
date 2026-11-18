'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export interface FunnelScores {
  fit: number;
  intent: number;
  readiness: number;
  friction: number;
  prospectName: string;
  tier: string;
}

export function SignalTopologyCanvas({
  scores,
  onNavigateScreen,
}: {
  scores: FunnelScores;
  onNavigateScreen?: (screenId: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeStageText, setActiveStageText] = useState(
    '3D Education Growth Funnel Ready — Click any 3D stage or run Journey Animation'
  );
  const particleRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pillarsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = 240;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 12.5);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);
    const pLight1 = new THREE.PointLight(0x8b5cf6, 2.4, 30);
    pLight1.position.set(6, 6, 8);
    scene.add(pLight1);
    const pLight2 = new THREE.PointLight(0x14b8a6, 2.2, 30);
    pLight2.position.set(-6, -4, 8);
    scene.add(pLight2);

    const group = new THREE.Group();
    scene.add(group);

    const interactiveMeshes: THREE.Mesh[] = [];

    // Stage 1: Acquisition Intake Ring (Left)
    const intakeMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.12, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e, metalness: 0.6, roughness: 0.25 })
    );
    intakeMesh.position.set(-4.6, 0, 0);
    intakeMesh.userData = { screen: 'explorer', label: '1. Acquisition Intake -> Prospect Explorer' };
    group.add(intakeMesh);
    interactiveMeshes.push(intakeMesh);

    // Stage 2: 4-Axis AI Qualification Pillars (Center-Left, data-bound to Fit/Intent/Readiness/Friction)
    const axisValues = [scores.fit, scores.intent, scores.readiness, scores.friction];
    const axisColors = [0x14b8a6, 0x8b5cf6, 0x10b981, 0xf43f5e];
    pillarsRef.current = [];
    axisValues.forEach((val, idx) => {
      const h = Math.max(0.45, (val / 100) * 2.1);
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, h, 0.38),
        new THREE.MeshStandardMaterial({ color: axisColors[idx], emissive: 0x1e1b4b, roughness: 0.3, metalness: 0.5 })
      );
      pillar.position.set(-2.3 + idx * 0.55, h / 2 - 0.9, 0);
      pillar.userData = { screen: 'prospect360', label: '2. 4-Axis Qualification -> Prospect 360' };
      group.add(pillar);
      pillarsRef.current.push(pillar);
      interactiveMeshes.push(pillar);
    });

    // Stage 3: Verified Knowledge Vault (Center)
    const vaultMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.95, 0),
      new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x042f2e, metalness: 0.7, roughness: 0.2, wireframe: true })
    );
    vaultMesh.position.set(0.6, 0.2, 0);
    vaultMesh.userData = { screen: 'knowledge', label: '3. Verified Knowledge Vault -> Knowledge Centre' };
    group.add(vaultMesh);
    interactiveMeshes.push(vaultMesh);

    // Stage 4: Multilingual Engagement Studio Ring (Center-Right)
    const engageMesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.62, 0.16, 48, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x3b0764, metalness: 0.65, roughness: 0.25 })
    );
    engageMesh.position.set(2.7, 0.2, 0);
    engageMesh.userData = { screen: 'engagement', label: '4. 6-Language Engagement -> Engagement Studio' };
    group.add(engageMesh);
    interactiveMeshes.push(engageMesh);

    // Stage 5: Enrollment Growth Crown (Right)
    const crownMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x064e3b, metalness: 0.75, roughness: 0.2 })
    );
    crownMesh.position.set(4.8, 0.25, 0);
    crownMesh.userData = { screen: 'growth', label: '5. Enrollment Crown -> Growth Intelligence' };
    group.add(crownMesh);
    interactiveMeshes.push(crownMesh);

    // Connecting Growth Pipeline Beam
    const beamPoints = [
      intakeMesh.position.clone(),
      new THREE.Vector3(-1.4, 0, 0),
      vaultMesh.position.clone(),
      engageMesh.position.clone(),
      crownMesh.position.clone(),
    ];
    const beamLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(beamPoints),
      new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.6 })
    );
    group.add(beamLine);

    // Animated Student Signal Particle
    const studentParticle = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    studentParticle.position.copy(intakeMesh.position);
    group.add(studentParticle);
    particleRef.current = studentParticle;

    // Click Raycaster for 3D Navigation
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handleClick = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes);
      if (hits.length > 0 && hits[0].object.userData?.screen) {
        setActiveStageText(`Navigated via 3D Model: ${hits[0].object.userData.label}`);
        onNavigateScreen?.(hits[0].object.userData.screen);
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      intakeMesh.rotation.y += 0.012;
      vaultMesh.rotation.y += 0.018;
      engageMesh.rotation.x += 0.012;
      engageMesh.rotation.y += 0.016;
      crownMesh.rotation.y += 0.015;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = container.clientWidth || 720;
      camera.aspect = nw / height;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, [scores.fit, scores.intent, scores.readiness, scores.friction, onNavigateScreen]);

  const playJourneyAnimation = () => {
    const p = particleRef.current;
    if (!p) return;
    const waypoints = [
      { x: -4.6, y: 0, label: '1. Student Inquiry Captured (Acquisition Ring)' },
      { x: -1.4, y: 0.4, label: `2. AI Scoring ${scores.prospectName}: Fit ${scores.fit} · Intent ${scores.intent} (${scores.tier})` },
      { x: 0.6, y: 0.2, label: '3. Verified Brochure & EMI Facts Retrieved (Knowledge Vault)' },
      { x: 2.7, y: 0.2, label: '4. Grounded Multilingual Draft Created (Engagement Studio)' },
      { x: 4.8, y: 0.35, label: '5. Ready for Counsellor Approval & Enrollment Crown' },
    ];
    const tl = gsap.timeline();
    waypoints.forEach((wp) => {
      tl.to(p.position, {
        x: wp.x,
        y: wp.y,
        duration: 0.55,
        ease: 'power2.inOut',
        onStart: () => setActiveStageText(wp.label),
      });
    });
  };

  const sweepCamera = () => {
    const cam = cameraRef.current;
    if (!cam) return;
    gsap
      .timeline()
      .to(cam.position, { x: 4.2, y: 2.6, z: 10.2, duration: 1.0, ease: 'power2.inOut' })
      .to(cam.position, { x: -4.2, y: 1.8, z: 10.6, duration: 1.1, ease: 'power2.inOut' })
      .to(cam.position, { x: 0, y: 1.2, z: 12.5, duration: 0.9, ease: 'power2.out' });
  };

  return (
    <div className="rounded-lg bg-[#0D1322] border border-violet-500/30 p-4 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold text-white">
            3D Education Growth Funnel — Live Data Bound ({scores.prospectName} · {scores.tier})
          </h2>
          <p className="text-[11px] text-slate-400">
            Click any 3D model to jump to that module: Intake Ring · 4-Axis Pillars · Knowledge Vault · Engagement Knot · Enrollment Crown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={playJourneyAnimation}
            className="px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/35 border border-teal-500/40 text-teal-200 text-[11px] font-mono"
          >
            ▶ Animate Student Journey
          </button>
          <button
            type="button"
            onClick={sweepCamera}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono"
          >
            🎥 Camera Orbit
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          ref={mountRef}
          className="w-full h-[240px] rounded-lg bg-[#070B14] border border-slate-800/80 cursor-pointer overflow-hidden"
        />
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-teal-300 bg-[#070B14]/85 px-3 py-1 rounded border border-slate-800">
          <span>Click 3D Models to Navigate</span>
          <span>{activeStageText}</span>
        </div>
      </div>
    </div>
  );
}
