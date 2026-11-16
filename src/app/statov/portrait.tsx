'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const size = 720;
const eyes = [{ x: 276, y: 294 }, { x: 453, y: 295 }];
const radiusX = 31;
const radiusY = 15;
type Expression = 'smile' | 'wink';

export function Portrait() {
  const [expression, setExpression] = useState<Expression | null>(null);
  const smile = useRef<HTMLVideoElement>(null);
  const wink = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const still = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const surface = canvas.current;
    const photo = still.current;
    const box = container.current;
    const area = box?.closest('section');
    const context = surface?.getContext('2d', { willReadFrequently: true });
    if (!surface || !photo || !box || !area || !context) return;
    const motion = matchMedia('(prefers-reduced-motion: no-preference)');
    let idle = 0;
    let idleStage = 0;
    let navigation = 0;
    let active: HTMLVideoElement | null = null;

    const visible = () => {
      const bounds = box.getBoundingClientRect();
      return !document.hidden && bounds.top < innerHeight && bounds.bottom > innerHeight * 0.25;
    };

    function play(next: Expression) {
      const video = next === 'smile' ? smile.current : wink.current;
      if (!video || !motion.matches || !visible()) return false;
      active?.pause();
      active = video;
      video.currentTime = 0;
      void video.play().catch(() => {});
      return true;
    }

    function idleTick() {
      if (!motion.matches || !visible()) return;
      play(idleStage % 2 === 0 ? 'smile' : 'wink');
      idleStage++;
      idle = window.setTimeout(idleTick, 9500);
    }

    function activity() {
      clearTimeout(idle);
      idleStage = 0;
      if (motion.matches && visible()) idle = window.setTimeout(idleTick, 7500);
    }

    function click(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const control = event.target.closest('button, a');
      if (!control || !play('smile')) return;
      activity();
      const destination = control.getAttribute('href');
      if (destination?.startsWith('#') && destination !== '#statov-top') {
        event.preventDefault();
        clearTimeout(navigation);
        navigation = window.setTimeout(() => {
          window.location.hash = destination;
          const target = document.getElementById(destination.slice(1));
          target?.setAttribute('tabindex', '-1');
          target?.focus({ preventScroll: true });
        }, 660);
      }
    }

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const patches = () => {
      if (!photo.complete || !photo.naturalWidth) return [];
      context.drawImage(photo, 0, 0, size, size);
      const result = eyes.map((eye) => ({
        left: eye.x - radiusX,
        top: eye.y - radiusY,
        source: context.getImageData(eye.x - radiusX, eye.y - radiusY, radiusX * 2, radiusY * 2),
        output: context.createImageData(radiusX * 2, radiusY * 2),
      }));
      context.clearRect(0, 0, size, size);
      return result;
    };
    let samples: ReturnType<typeof patches> = [];

    function animate() {
      frame = 0;
      if (!motion.matches || !context) return;
      if (!samples.length) samples = patches();
      if (!samples.length) return;

      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;

      for (const { left, top, source, output } of samples) {
        const stride = source.width;
        for (let row = 0; row < source.height; row++) {
          for (let col = 0; col < stride; col++) {
            const distance = Math.hypot((col - radiusX) / radiusX, (row - radiusY) / radiusY);
            const weight = Math.max(0, Math.min(1, (1 - distance) * 2.1));
            const sx = Math.max(0, Math.min(stride - 1, col - x * weight));
            const sy = Math.max(0, Math.min(source.height - 1, row - y * weight));
            const ix = Math.floor(sx);
            const iy = Math.floor(sy);
            const dx = sx - ix;
            const dy = sy - iy;
            const east = Math.min(ix + 1, stride - 1);
            const south = Math.min(iy + 1, source.height - 1);
            const index = (row * stride + col) * 4;
            for (let color = 0; color < 3; color++) {
              const upper = source.data[(iy * stride + ix) * 4 + color] * (1 - dx)
                + source.data[(iy * stride + east) * 4 + color] * dx;
              const lower = source.data[(south * stride + ix) * 4 + color] * (1 - dx)
                + source.data[(south * stride + east) * 4 + color] * dx;
              output.data[index + color] = upper * (1 - dy) + lower * dy;
            }
            output.data[index + 3] = 255;
          }
        }
        context.putImageData(output, left, top);
      }
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.025) frame = requestAnimationFrame(animate);
    }

    const request = () => { if (!frame) frame = requestAnimationFrame(animate); };
    const reset = () => {
      targetX = 0;
      targetY = 0;
      if (motion.matches) request();
      else {
        active?.pause();
        setExpression(null);
        context.clearRect(0, 0, size, size);
      }
    };
    const move = (event: PointerEvent) => {
      if (!motion.matches || event.pointerType !== 'mouse') return;
      const bounds = box.getBoundingClientRect();
      const clamp = (value: number) => Math.min(1, Math.max(-1, value));
      targetX = clamp((event.clientX - bounds.left - bounds.width / 2) / (bounds.width * 0.4)) * 7;
      targetY = clamp((event.clientY - bounds.top - bounds.height * 0.41) / (bounds.height * 0.36)) * 4;
      request();
    };

    area.addEventListener('pointermove', move);
    area.addEventListener('pointerleave', reset);
    box.closest('main')?.addEventListener('click', click);
    window.addEventListener('scroll', activity, { passive: true });
    window.addEventListener('pointermove', activity, { passive: true });
    document.addEventListener('visibilitychange', activity);
    motion.addEventListener('change', activity);
    motion.addEventListener('change', reset);
    activity();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      clearTimeout(navigation);
      box.closest('main')?.removeEventListener('click', click);
      window.removeEventListener('scroll', activity);
      window.removeEventListener('pointermove', activity);
      document.removeEventListener('visibilitychange', activity);
      motion.removeEventListener('change', activity);
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', reset);
      motion.removeEventListener('change', reset);
    };
  }, []);

  return <div ref={container} style={{ width: '100%', height: '100%' }}>
    <Image ref={still} src="/statov/portrait-video.jpg" alt="Андрей Статов" width={size} height={size} priority unoptimized />
    <canvas ref={canvas} width={size} height={size} aria-hidden="true" hidden={expression !== null} />
    {(['smile', 'wink'] as const).map((clip) => (
      <video key={clip} ref={clip === 'smile' ? smile : wink} src={'/statov/' + clip + '.mp4'}
        preload="auto" muted playsInline aria-hidden="true" data-active={expression === clip}
        onPlaying={() => setExpression(clip)} onEnded={() => setExpression((shown) => shown === clip ? null : shown)} />
    ))}
  </div>;
}
