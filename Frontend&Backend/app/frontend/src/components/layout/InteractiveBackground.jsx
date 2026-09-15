import React, { useEffect, useRef } from 'react';

/**
 * Cruip Stellar Inspired Interactive Background:
 * - Dynamic cursor spotlight tracking mouse coordinates across the viewport
 * - Spotlight card border and surface illumination
 * - Interactive floating forensic particle constellation on canvas that illuminates near the cursor
 */
export const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // 1. Mouse Spotlight tracking for CSS variables and cards
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      document.documentElement.style.setProperty('--cursor-x', `${clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${clientY}px`);

      // Update any spotlight cards currently in view
      const cards = document.querySelectorAll('.spotlight-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 2. Canvas Interactive Particle System
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool
    const particleCount = Math.min(Math.floor((width * height) / 14000), 85);
    const particles = [];
    const mouse = { x: -1000, y: -1000, radius: 180 };

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.4 + 0.15,
        color: Math.random() > 0.3 ? 'rgba(99, 102, 241,' : 'rgba(6, 182, 212,',
      });
    }

    const onCanvasMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onCanvasMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', onCanvasMouseMove, { passive: true });
    document.addEventListener('mouseleave', onCanvasMouseLeave);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Distance to cursor
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let alpha = p.baseAlpha;
        if (dist < mouse.radius) {
          const proximity = 1 - dist / mouse.radius;
          alpha = Math.min(0.9, p.baseAlpha + proximity * 0.6);

          // Draw faint glowing connective filament to cursor
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${proximity * 0.22})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - dist2 / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Draw particle dot with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${alpha})`;
        ctx.shadowBlur = dist < mouse.radius ? 8 : 0;
        ctx.shadowColor = '#6366F1';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', onCanvasMouseMove);
      document.removeEventListener('mouseleave', onCanvasMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* 1. Global Interactive Mouse Spotlight Glow */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at var(--cursor-x, 50vw) var(--cursor-y, 30vh), rgba(99, 102, 241, 0.14), rgba(6, 182, 212, 0.04) 40%, transparent 80%)`,
        }}
      />

      {/* 2. Interactive Stellar Particle Constellation Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none -z-10 opacity-70"
      />
    </>
  );
};
