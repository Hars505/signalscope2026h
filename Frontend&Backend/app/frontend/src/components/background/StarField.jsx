import React, { useEffect, useRef } from 'react';

/**
 * Tunable interaction radius approximating ~1 cm on typical desktop displays.
 */
const STAR_INTERACTION_RADIUS = 45;

/**
 * StarField: Performant canvas star field & forensic telemetry dot matrix.
 */
export const StarField = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      if (prefersReducedMotion) {
        drawStatic();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
    };

    const handleMouseMove = (e) => {
      if (isTouchDevice || prefersReducedMotion) return;
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Dense, rich star & dot count (~90-140)
    const starCount = Math.min(Math.max(Math.floor((width * height) / 9500), 90), 140);
    const stars = [];

    // Continuous organic drift velocity: visible floating motion that keeps the space alive
    const getRandomVelocity = (isCrossSparkle) => {
      const baseSpeed = isCrossSparkle
        ? Math.random() * 0.14 + 0.09
        : Math.random() * 0.22 + 0.12;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      return {
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
      };
    };

    for (let i = 0; i < starCount; i++) {
      const randType = Math.random();
      const isCrossSparkle = randType < 0.22; // ~22% diamond cross sparkles
      const isBlackDot = !isCrossSparkle && randType < 0.62; // ~40% telemetry / black dots

      let radius;
      let baseAlpha;
      let color;

      if (isCrossSparkle) {
        radius = Math.random() * 2.8 + 3.2;
        baseAlpha = Math.random() * 0.35 + 0.55;
        const cRand = Math.random();
        color = cRand < 0.50 ? '18, 168, 121' : cRand < 0.80 ? '11, 43, 31' : '217, 119, 6';
      } else if (isBlackDot) {
        // High-contrast telemetry dots (deep black / dark forest green dots for light theme)
        radius = Math.random() * 1.4 + 1.0;
        baseAlpha = Math.random() * 0.45 + 0.55;
        color = Math.random() < 0.65 ? '11, 43, 31' : '18, 30, 24';
      } else {
        // Celestial glowing stars
        radius = Math.random() * 1.6 + 1.1;
        baseAlpha = Math.random() * 0.35 + 0.45;
        const cRand = Math.random();
        color = cRand < 0.5 ? '18, 168, 121' : cRand < 0.8 ? '11, 43, 31' : '217, 119, 6';
      }

      const vel = getRandomVelocity(isCrossSparkle);

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseAlpha,
        color,
        isCrossSparkle,
        isBlackDot,
        vx: vel.vx,
        vy: vel.vy,
        baseVx: vel.vx,
        baseVy: vel.vy,
        swaySpeed: Math.random() * 0.9 + 0.4,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmp: Math.random() * 3.5 + 1.5,
        twinkleSpeed: Math.random() * 1.3 + 0.6,
        twinklePhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
      });
    }

    // High performance 4-pointed diamond glint (fast path, zero heavy ellipse allocations)
    const drawCrossSparkle = (cx, cy, armLength, alpha, color) => {
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy - armLength);
      ctx.lineTo(cx + armLength * 0.22, cy - armLength * 0.22);
      ctx.lineTo(cx + armLength, cy);
      ctx.lineTo(cx + armLength * 0.22, cy + armLength * 0.22);
      ctx.lineTo(cx, cy + armLength);
      ctx.lineTo(cx - armLength * 0.22, cy + armLength * 0.22);
      ctx.lineTo(cx - armLength, cy);
      ctx.lineTo(cx - armLength * 0.22, cy - armLength * 0.22);
      ctx.closePath();
      ctx.fill();

      // Nucleus dot
      ctx.fillStyle = `rgba(11, 43, 31, ${Math.min(1, alpha + 0.3)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, armLength * 0.26, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.isCrossSparkle) {
          drawCrossSparkle(star.x, star.y, star.radius, star.baseAlpha, star.color);
        } else {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${star.color}, ${star.baseAlpha})`;
          ctx.fill();
        }
      }
    };

    if (prefersReducedMotion) {
      drawStatic();
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    let time = 0;
    let lastTime = performance.now();

    const render = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const timeFactor = dt * 60;
      time += dt;

      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Smooth continuous upward & lateral flight
        star.x += star.vx * timeFactor;
        star.y += star.vy * timeFactor;

        star.vx += (star.baseVx - star.vx) * 0.015 * timeFactor;
        star.vy += (star.baseVy - star.vy) * 0.015 * timeFactor;

        // Screen wrapping with smooth margin
        if (star.x < -30) {
          star.x = width + 30;
        } else if (star.x > width + 30) {
          star.x = -30;
        }

        if (star.y < -30) {
          star.y = height + 30;
          star.x = Math.random() * width;
        } else if (star.y > height + 30) {
          star.y = -30;
          star.x = Math.random() * width;
        }

        // Harmonic sway on draw coordinates
        const drawX = star.x + Math.sin(time * star.swaySpeed + star.swayPhase) * star.swayAmp;
        const drawY = star.y;

        // Sparkling & twinkling offset
        const twinkleOffset = star.isBlackDot
          ? 0 // Black/telemetry dots stay crisp and stable
          : Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.25;

        // Fluid interactive cursor proximity
        let interaction = 0;
        if (mouse.x > -500) {
          const dx = drawX - mouse.x;
          const dy = drawY - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < STAR_INTERACTION_RADIUS && dist > 0) {
            interaction = 1 - dist / STAR_INTERACTION_RADIUS;
            const push = interaction * interaction * 0.5;
            star.vx += (dx / dist) * push * 0.15;
            star.vy += (dy / dist) * push * 0.15;
          }
        }

        const finalAlpha = Math.min(1.0, Math.max(0.25, star.baseAlpha + twinkleOffset + interaction * 0.4));
        const finalRadius = star.radius * (1 + (interaction > 0 ? interaction * 0.35 : 0));

        if (star.isCrossSparkle) {
          drawCrossSparkle(drawX, drawY, finalRadius, finalAlpha, star.color);
        } else {
          ctx.beginPath();
          ctx.arc(drawX, drawY, finalRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${star.color}, ${finalAlpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none -z-10"
    />
  );
};

export default StarField;
