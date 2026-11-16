'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { createPortraitRenderer } from './portrait-renderer';

const frameUrl = '/statov/portrait-video.jpg';

function smoothstep(value: number) {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}

export function Portrait() {
  const image = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const photo = image.current;
    const surface = canvas.current;
    const box = container.current;
    const hero = box?.closest('section');
    if (!photo || !surface || !box || !hero) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: ReturnType<typeof createPortraitRenderer> = null;
    let visible = false;
    let frame = 0;
    let timer = 0;
    let previous = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let eyesX = 0;
    let eyesY = 0;
    let smile = 0;
    let wink = 0;
    let expression: { type: 'smile' | 'wink'; at: number } | null = null;

    function schedule() {
      if (!frame && visible && renderer && !document.hidden && !reduced.matches) {
        frame = requestAnimationFrame(draw);
      }
    }

    function draw(now: number) {
      frame = 0;
      if (!renderer || !visible || document.hidden || reduced.matches) return;
      const dt = previous ? Math.min(40, now - previous) : 16;
      previous = now;
      const headEase = 1 - Math.exp(-dt / 128);
      const eyeEase = 1 - Math.exp(-dt / 70);
      x += (targetX - x) * headEase;
      y += (targetY - y) * headEase;
      eyesX += (targetX - eyesX) * eyeEase;
      eyesY += (targetY - eyesY) * eyeEase;

      let smileTarget = 0;
      let winkTarget = 0;
      if (expression) {
        const elapsed = now - expression.at;
        if (expression.type === 'smile') {
          smileTarget = smoothstep(elapsed / 660) * (1 - smoothstep((elapsed - 1160) / 700));
          if (elapsed > 1860) expression = null;
        } else {
          winkTarget = smoothstep(elapsed / 108) * (1 - smoothstep((elapsed - 215) / 180));
          smileTarget = winkTarget * 0.18;
          if (elapsed > 395) expression = null;
        }
      }
      const expressionEase = 1 - Math.exp(-dt / 34);
      smile += (smileTarget - smile) * expressionEase;
      wink += (winkTarget - wink) * expressionEase;
      renderer.draw(x, y, eyesX, eyesY, smile, wink);

      if (expression || Math.abs(x - targetX) + Math.abs(y - targetY) +
          Math.abs(eyesX - targetX) + Math.abs(eyesY - targetY) + smile + wink > 0.002) {
        schedule();
      } else {
        previous = 0;
      }
    }

    function play(type: 'smile' | 'wink') {
      if (!visible || document.hidden || reduced.matches || !renderer) return;
      expression = { type, at: performance.now() };
      schedule();
      timer = window.setTimeout(() => play(type === 'smile' ? 'wink' : 'smile'), type === 'smile' ? 8700 : 11000);
    }

    function waitForIdle() {
      clearTimeout(timer);
      expression = null;
      if (visible && !document.hidden && !reduced.matches && renderer) {
        timer = window.setTimeout(() => play('smile'), 7200);
      }
      schedule();
    }

    function point(event: PointerEvent) {
      if (!hero || !box || !renderer || reduced.matches || !visible) return;
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        const section = hero.getBoundingClientRect();
        const portrait = box.getBoundingClientRect();
        const eyeLine = portrait.top + Math.min(portrait.width, portrait.height) * 0.44;
        const clamp = (value: number) => Math.max(-1, Math.min(1, value));
        targetX = clamp((event.clientX - portrait.left - portrait.width / 2) / (section.width * 0.39));
        targetY = clamp((event.clientY - eyeLine) / (section.height * 0.36));
      }
      waitForIdle();
    }

    function resize() {
      if (!box || !surface || !renderer) return;
      const bounds = box.getBoundingClientRect();
      const pixels = Math.max(1, Math.min(1080, Math.round(Math.min(bounds.width, bounds.height) * devicePixelRatio)));
      if (pixels !== surface.width || pixels !== surface.height) surface.width = surface.height = pixels;
      renderer.draw(x, y, eyesX, eyesY, smile, wink);
    }

    function activate() {
      if (!surface || !photo || reduced.matches || !photo.complete || !photo.naturalWidth || !visible) return;
      if (!renderer) {
        renderer = createPortraitRenderer(surface, photo);
        if (!renderer) return;
        resize();
      }
      surface.hidden = false;
    }

    function sync() {
      if (!surface) return;
      if (reduced.matches) surface.hidden = true;
      else activate();
      if (!visible) {
        x = y = eyesX = eyesY = targetX = targetY = smile = wink = 0;
        previous = 0;
      }
      waitForIdle();
    }

    function lost(event: Event) {
      event.preventDefault();
      renderer = null;
      if (surface) surface.hidden = true;
      waitForIdle();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.3;
      sync();
    }, { threshold: 0.3 });
    observer.observe(hero);
    const sizes = new ResizeObserver(resize);
    sizes.observe(box);
    photo.addEventListener('load', sync);
    hero.addEventListener('pointermove', point, { passive: true });
    document.addEventListener('visibilitychange', sync);
    surface.addEventListener('webglcontextlost', lost);
    surface.addEventListener('webglcontextrestored', sync);
    reduced.addEventListener('change', sync);

    return () => {
      observer.disconnect();
      sizes.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      renderer?.dispose();
      photo.removeEventListener('load', sync);
      hero.removeEventListener('pointermove', point);
      document.removeEventListener('visibilitychange', sync);
      surface.removeEventListener('webglcontextlost', lost);
      surface.removeEventListener('webglcontextrestored', sync);
      reduced.removeEventListener('change', sync);
    };
  }, []);

  return <div ref={container}>
    <Image ref={image} src={frameUrl} alt="Андрей Статов" width={720} height={720} priority unoptimized />
    <canvas ref={canvas} width={720} height={720} aria-hidden="true" hidden />
  </div>;
}
