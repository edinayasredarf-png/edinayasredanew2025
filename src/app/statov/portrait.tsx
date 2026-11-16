'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const size = 448;
const center = 4;
const poseFile = '/statov/portrait-poses.webp';
type Expression = 'smile' | 'wink';

export function Portrait() {
  const [expression, setExpression] = useState<Expression | null>(null);
  const smile = useRef<HTMLVideoElement>(null);
  const wink = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = canvas.current;
    const area = container.current?.closest('section');
    const context = surface?.getContext('2d', { alpha: false });
    if (!surface || !area || !context) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mouse = matchMedia('(any-pointer: fine)');
    let poses: HTMLImageElement | undefined;
    let active: HTMLVideoElement | null = null;
    let idle = 0;
    let frame = 0;
    let lastFrame = 0;
    let visible = false;
    let next: Expression = 'smile';
    let targetX = center;
    let targetY = center;
    let x = center;
    let y = center;

    function loadPoses() {
      if (poses || reduced.matches) return;
      poses = new window.Image();
      poses.onload = requestFrame;
      poses.src = poseFile;
    }

    function draw(now: number) {
      frame = 0;
      if (!surface || !context || !poses?.naturalWidth || reduced.matches) return;
      const elapsed = lastFrame ? Math.min(now - lastFrame, 50) : 16;
      lastFrame = now;
      const easing = 1 - Math.exp(-elapsed / 82);
      x += (targetX - x) * easing;
      y += (targetY - y) * easing;

      const remaining = Math.abs(targetX - x) + Math.abs(targetY - y);
      if (remaining < 0.025) {
        x = targetX;
        y = targetY;
      }

      const offset = Math.abs(x - center) + Math.abs(y - center);
      surface.style.opacity = String(Math.min(1, offset * 2));
      if (offset) {
        const left = Math.floor(x);
        const top = Math.floor(y);
        const across = x - left;
        const down = y - top;
        let drawn = 0;
        for (const [column, row, weight] of [
          [left, top, (1 - across) * (1 - down)],
          [left + 1, top, across * (1 - down)],
          [left, top + 1, (1 - across) * down],
          [left + 1, top + 1, across * down],
        ]) {
          if (!weight) continue;
          drawn += weight;
          context.globalAlpha = weight / drawn;
          context.drawImage(poses, column * size, row * size, size, size, 0, 0, size, size);
        }
        context.globalAlpha = 1;
      }
      if (remaining >= 0.025) frame = requestAnimationFrame(draw);
      else lastFrame = 0;
    }

    function requestFrame() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function neutral() {
      targetX = center;
      targetY = center;
      requestFrame();
    }

    function stopClip() {
      if (!active) return;
      active.pause();
      active = null;
      setExpression(null);
    }

    function canAnimate() {
      return visible && !document.hidden && !reduced.matches;
    }

    function idleExpression() {
      if (!canAnimate()) return;
      const video = next === 'smile' ? smile.current : wink.current;
      next = next === 'smile' ? 'wink' : 'smile';
      if (video) {
        active = video;
        video.currentTime = 0;
        void video.play().catch(() => {});
      }
      idle = window.setTimeout(idlePose, 9300);
    }

    function idlePose() {
      neutral();
      idle = window.setTimeout(idleExpression, 320);
    }

    function restartIdle() {
      clearTimeout(idle);
      stopClip();
      next = 'smile';
      if (canAnimate()) idle = window.setTimeout(idlePose, 7200);
    }

    function move(event: PointerEvent) {
      if (!area || !canAnimate()) return;
      restartIdle();
      if (event.pointerType !== 'mouse') return;
      loadPoses();
      const bounds = area.getBoundingClientRect();
      const portrait = container.current?.getBoundingClientRect();
      const eyes = portrait ? portrait.top + Math.min(portrait.width, portrait.height) * 0.41 : bounds.top + bounds.height * 0.35;
      const clamp = (value: number) => Math.max(0, Math.min(2 * center, value));
      targetX = clamp(center + ((event.clientX - bounds.left) / bounds.width - 0.5) * 2.5 * center);
      targetY = clamp(center + (event.clientY - eyes) / (bounds.height * 0.41) * center);
      requestFrame();
    }

    function leave() {
      neutral();
      restartIdle();
    }

    function changeMotion() {
      if (reduced.matches) {
        if (surface) surface.style.opacity = '0';
        x = center;
        y = center;
      } else if (mouse.matches && visible) loadPoses();
      leave();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.3;
      if (visible && mouse.matches) loadPoses();
      leave();
    }, { threshold: 0.3 });
    observer.observe(area);
    area.addEventListener('pointermove', move, { passive: true });
    area.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', leave);
    reduced.addEventListener('change', changeMotion);

    return () => {
      observer.disconnect();
      clearTimeout(idle);
      cancelAnimationFrame(frame);
      if (poses) poses.onload = null;
      active?.pause();
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', leave);
      reduced.removeEventListener('change', changeMotion);
    };
  }, []);

  return <div ref={container} style={{ width: '100%', height: '100%' }}>
    <Image src="/statov/portrait-video.jpg" alt="Андрей Статов" width={720} height={720} priority unoptimized />
    <canvas ref={canvas} width={size} height={size} aria-hidden="true" hidden={expression !== null} style={{ opacity: 0 }} />
    {(['smile', 'wink'] as const).map((clip) => (
      <video key={clip} ref={clip === 'smile' ? smile : wink} src={'/statov/' + clip + '.mp4'}
        preload="auto" muted playsInline aria-hidden="true" data-active={expression === clip}
        onPlaying={() => setExpression(clip)} onEnded={() => setExpression((shown) => shown === clip ? null : shown)} />
    ))}
  </div>;
}
