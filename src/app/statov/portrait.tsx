'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const width = 678;
const height = 604;
const eyes = [{ x: 266, y: 292 }, { x: 423, y: 289 }];
const radiusX = 29;
const radiusY = 14;

export function Portrait() {
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
    const motion = matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const patches = () => {
      if (!photo.complete || !photo.naturalWidth) return [];
      context.drawImage(photo, 0, 0, width, height);
      const result = eyes.map((eye) => ({
        left: eye.x - radiusX,
        top: eye.y - radiusY,
        source: context.getImageData(eye.x - radiusX, eye.y - radiusY, radiusX * 2, radiusY * 2),
        output: context.createImageData(radiusX * 2, radiusY * 2),
      }));
      context.clearRect(0, 0, width, height);
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
      else context.clearRect(0, 0, width, height);
    };
    const move = (event: PointerEvent) => {
      if (!motion.matches || event.pointerType !== 'mouse') return;
      const bounds = box.getBoundingClientRect();
      const clamp = (value: number) => Math.min(1, Math.max(-1, value));
      targetX = clamp((event.clientX - bounds.left - bounds.width / 2) / (bounds.width * 0.4)) * 7;
      targetY = clamp((event.clientY - bounds.top - bounds.height * 0.47) / (bounds.height * 0.36)) * 4;
      request();
    };

    area.addEventListener('pointermove', move);
    area.addEventListener('pointerleave', reset);
    motion.addEventListener('change', reset);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', reset);
      motion.removeEventListener('change', reset);
    };
  }, []);

  return <div ref={container} style={{ width: '100%', height: '100%' }}>
    <Image ref={still} src="/statov/portrait.jpg" alt="Андрей Статов" width={width} height={height} priority unoptimized />
    <canvas ref={canvas} width={width} height={height} aria-hidden="true" />
  </div>;
}
