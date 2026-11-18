'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const NINE_TOOLS = [
  '1. classify_intent',
  '2. detect_conversion_barriers',
  '3. score_prospect',
  '4. search_programme_facts',
  '5. recommend_next_action',
  '6. draft_multilingual_followup',
  '7. escalate_to_counsellor',
  '8. create_followup_task',
  '9. record_conversion_event',
];

export function SignalTopologyCanvas({ activeToolIndex = 0 }: { activeToolIndex?: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [pulseCount, setPulseCount] = useState(1);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = 180;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const nodes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.IcosahedronGeometry(0.55, 1);

    NINE_TOOLS.forEach((_, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x8b5cf6 : 0x14b8a6,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.x = (idx - 4) * 2.2;
      mesh.position.y = Math.sin(idx * 0.9) * 1.1;
      group.add(mesh);
      nodes.push(mesh);
    });

    // Connect nodes with a line
    const points = nodes.map((n) => n.position.clone());
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.45 });
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);

    // Animate active node with GSAP
    const targetNode = nodes[activeToolIndex % nodes.length];
    if (targetNode) {
      gsap.to(targetNode.scale, {
        x: 1.6,
        y: 1.6,
        z: 1.6,
        duration: 0.45,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      });
    }

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      nodes.forEach((n, idx) => {
        n.rotation.x += 0.012;
        n.rotation.y += 0.018;
        n.position.y = Math.sin(Date.now() * 0.002 + idx) * 0.65;
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [activeToolIndex, pulseCount]);

  return (
    <div className="rounded-lg bg-[#0D1322] border border-slate-800 p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-white">Three.js + GSAP 3D Agent Execution Topology (9 Specialist Tools)</span>
        <button
          type="button"
          onClick={() => setPulseCount((c) => c + 1)}
          className="px-2.5 py-1 rounded bg-violet-600/30 border border-violet-500/40 text-violet-200 text-[11px]"
        >
          Trigger 3D Signal Pulse
        </button>
      </div>
      <div ref={mountRef} className="w-full h-[180px] rounded bg-[#070B14] overflow-hidden" />
    </div>
  );
}
