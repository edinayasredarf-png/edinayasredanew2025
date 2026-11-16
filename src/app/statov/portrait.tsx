'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const size = 640;
const perSheet = 16;
const range = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, index) => first + index);

// The source only turns fully to the left. The other branch uses the original
// upward/rightward gaze instead of mirroring or stretching the subject.
const left = [1, ...range(17, 59)];
const right = [1, ...range(96, 100).reverse(), ...range(75, 88).reverse()];
const smile = [1, ...range(100, 116)];
const wink = [1, ...range(92, 100).reverse()];
const banks = [[1, ...range(17, 59)], range(75, 116)];
type Pose = { track: number[]; position: number };
const neutral: Pose = { track: left, position: 0 };

function aim(x: number, y: number): Pose {
  const up = Math.max(0, -y);
  const down = Math.max(0, y);
  if (Math.max(Math.abs(x), Math.abs(y)) < 0.13) return neutral;

  if (x < -0.13 || down > 0.22 && Math.abs(x) < 0.2) {
    const turn = Math.min(1, Math.max(0, (-x - 0.08) / 0.92));
    const lift = Math.min(1, Math.max(0, (up - 0.22) / 0.78));
    const base = 4 + 23 * turn + 7 * down * (1 - turn);
    const position = base + (left.length - 1 - base) * lift * turn;
    // Frame 24 is the first open-eyed pose after the in-camera blink.
    return { track: left, position: Math.max(8, Math.round(position)) };
  }
  if (x > 0.13 || up > 0.13) {
    const position = up > 0.18 || x > 0.58
      ? 8 + Math.max(0, up - x * 0.55) * 10
      : 3 + x * 3;
    return { track: right, position: Math.round(position) };
  }
  return neutral;
}

export function Portrait() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = canvas.current;
    const box = container.current;
    const hero = box?.closest('section');
    const context = surface?.getContext('2d', { alpha: false });
    if (!surface || !box || !hero || !context) return;

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(any-pointer: fine)');
    const sheets = new Map<string, HTMLImageElement>();
    const locations = new Map(banks.flatMap((bank, b) => bank.map((number, index) => {
      const tile = index % perSheet;
      return [number, {
        sheet: b + '-' + Math.floor(index / perSheet),
        u: tile % 4 * size,
        v: Math.floor(tile / 4) * size,
      }] as const;
    })));

    let visible = false;
    let requested = 0;
    let timer = 0;
    let hold = 0;
    let previous = 0;
    let lastDrawn = -1;
    let position = 0;
    let track = left;
    let desired = neutral;
    let expression: Pose | null = null;

    function load(key: string) {
      if (sheets.has(key)) return;
      const image = new window.Image();
      sheets.set(key, image);
      image.onload = () => {
        lastDrawn = -1;
        schedule();
      };
      image.src = '/statov/portrait-natural-' + key + '.webp';
    }

    function preload(frames: number[]) {
      const keys = new Set(frames.map((number) => locations.get(number)?.sheet).filter((key) => key !== undefined));
      keys.forEach(load);
    }

    function paint(number: number) {
      if (!surface || !context) return false;
      if (number === lastDrawn) return true;
      if (number === 1) {
        surface.hidden = true;
        lastDrawn = number;
        return true;
      }
      const tile = locations.get(number);
      if (!tile) return false;
      const image = sheets.get(tile.sheet);
      if (!image?.complete || !image.naturalWidth) {
        load(tile.sheet);
        return false;
      }
      context.drawImage(image, tile.u, tile.v, size, size, 0, 0, surface.width, surface.height);
      surface.hidden = false;
      lastDrawn = number;
      return true;
    }

    function schedule() {
      if (!requested && visible && !document.hidden && !motion.matches) {
        requested = requestAnimationFrame(move);
      }
    }

    function move(now: number) {
      requested = 0;
      if (!visible || document.hidden || motion.matches) return;
      const elapsed = previous ? Math.min(now - previous, 42) : 16;
      previous = now;
      const target = expression ?? desired;
      if (track !== target.track && position === 0) track = target.track;
      const end = track === target.track ? target.position : 0;
      const delta = end - position;
      const speed = expression ? 26 : Math.min(48, Math.max(15, Math.abs(delta) * 4.5));
      const next = position + Math.sign(delta) * Math.min(Math.abs(delta), elapsed * speed / 1000);
      if (!paint(track[Math.round(next)])) {
        previous = 0;
        return;
      }
      position = next;
      if (position !== end || track !== target.track) {
        schedule();
      } else {
        previous = 0;
        if (expression && !hold) {
          hold = window.setTimeout(() => {
            hold = 0;
            expression = null;
            schedule();
          }, track === smile ? 560 : 75);
        }
      }
    }

    function idle(next: 'smile' | 'wink') {
      if (!visible || document.hidden || motion.matches) return;
      const path = next === 'smile' ? smile : wink;
      expression = { track: path, position: path.length - 1 };
      schedule();
      timer = window.setTimeout(() => idle(next === 'smile' ? 'wink' : 'smile'), 9000);
    }

    function waitForIdle() {
      clearTimeout(timer);
      clearTimeout(hold);
      hold = 0;
      expression = null;
      if (visible && !document.hidden && !motion.matches) {
        timer = window.setTimeout(() => idle('smile'), 7400);
        schedule();
      }
    }

    function point(event: PointerEvent) {
      if (!hero || !box || !visible || motion.matches) return;
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        const bounds = hero.getBoundingClientRect();
        const portrait = box.getBoundingClientRect();
        const eyes = portrait.top + Math.min(portrait.height, portrait.width) * 0.44;
        const clamp = (value: number) => Math.max(-1, Math.min(1, value));
        desired = aim(
          clamp((event.clientX - portrait.left - portrait.width / 2) / (bounds.width * 0.39)),
          clamp((event.clientY - eyes) / (bounds.height * 0.37)),
        );
      }
      waitForIdle();
    }

    function resize() {
      if (!box || !surface) return;
      const bounds = box.getBoundingClientRect();
      const pixels = Math.max(1, Math.min(960, Math.round(Math.min(bounds.width, bounds.height) * devicePixelRatio)));
      if (pixels === surface.width && pixels === surface.height) return;
      surface.width = surface.height = pixels;
      lastDrawn = -1;
      schedule();
    }

    function sync() {
      if (!surface) return;
      if (visible && !motion.matches) {
        preload(smile);
        preload(wink);
        if (finePointer.matches) preload([...left, ...right]);
      } else {
        surface.hidden = true;
        position = 0;
        desired = neutral;
        track = left;
        lastDrawn = -1;
        previous = 0;
      }
      waitForIdle();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.3;
      sync();
    }, { threshold: 0.3 });
    observer.observe(hero);
    const sizes = new ResizeObserver(resize);
    sizes.observe(box);
    hero.addEventListener('pointermove', point, { passive: true });
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);

    return () => {
      observer.disconnect();
      sizes.disconnect();
      clearTimeout(timer);
      clearTimeout(hold);
      cancelAnimationFrame(requested);
      sheets.forEach((image) => { image.onload = null; });
      hero.removeEventListener('pointermove', point);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);

  return <div ref={container}>
    <Image src="/statov/portrait-video.jpg" alt="Андрей Статов" width={720} height={720} priority unoptimized />
    <canvas ref={canvas} width={size} height={size} aria-hidden="true" hidden />
  </div>;
}
