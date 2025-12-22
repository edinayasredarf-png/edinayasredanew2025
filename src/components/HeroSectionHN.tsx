import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Button from "./Button";
import { useModal } from "./ModalProvider";

type Flake = { x: number; y: number; r: number; vy: number; vx: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSmoothNoise1D(len: number, points: number, amp: number, rnd: () => number) {
  const anchors = new Array(points).fill(0).map(() => (rnd() * 2 - 1) * amp);
  const out = new Array(len).fill(0);

  for (let i = 0; i < len; i++) {
    const t = (i / (len - 1)) * (points - 1);
    const a = Math.floor(t);
    const b = Math.min(points - 1, a + 1);
    const f = t - a;
    const s = f * f * (3 - 2 * f); // smoothstep
    out[i] = anchors[a] * (1 - s) + anchors[b] * s;
  }
  return out;
}

const HeroSection: React.FC = () => {
  const { openDemo } = useModal();

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let rafId = 0;

    // CSS размеры (в них рисуем)
    let vw = 0;
    let vh = 0;
    let dpr = 1;

    // Холмы
    let step = 3;
    let hills: number[] = [];
    let hillBand = 120;

    // Снег
    const flakes: Flake[] = [];
    let flakesCount = 100;

    // Текстура (зерно/кристаллики) — предген, чтобы не мигало
    type Speck = { x: number; yOff: number; r: number; a: number };
    let specks: Speck[] = [];
    let speckSeed = 2025;

    const seed = 1337;

    const createFlake = (inView = false): Flake => ({
      x: Math.random() * vw,
      y: inView ? Math.random() * vh : -20 - Math.random() * 80,
      r: Math.random() * 2.0 + 0.7,
      vy: Math.random() * 1.15 + 0.55,
      vx: (Math.random() - 0.5) * 0.22,
    });

    const rebuildFlakes = () => {
      flakes.length = 0;
      for (let i = 0; i < flakesCount; i++) flakes.push(createFlake(true));
    };

    const rebuildHills = () => {
      hillBand = clamp(vh * 0.24, 85, 170);

      step = vw < 420 ? 2 : vw < 1024 ? 3 : 4;
      const len = Math.max(3, Math.ceil(vw / step) + 1);

      const base = hillBand * 0.34;
      const amp1 = hillBand * 0.46;
      const amp2 = hillBand * 0.18;

      const points1 = clamp(Math.floor(vw / 180), 6, 16);
      const points2 = clamp(Math.floor(vw / 95), 10, 28);

      const rnd = mulberry32(seed);
      const n1 = makeSmoothNoise1D(len, points1, amp1, rnd);
      const n2 = makeSmoothNoise1D(len, points2, amp2, rnd);

      hills = new Array(len).fill(0).map((_, i) => base + n1[i] + n2[i]);

      // чуть пригладить края
      const edge = Math.min(12, Math.floor(len * 0.07));
      for (let i = 0; i < edge; i++) {
        const t = i / Math.max(1, edge - 1);
        hills[i] *= 0.85 + 0.15 * t;
        hills[len - 1 - i] *= 0.85 + 0.15 * t;
      }

      // Доп. сглаживание массива (мягче углы)
      const smoothed = hills.slice();
      for (let i = 1; i < hills.length - 1; i++) {
        smoothed[i] = hills[i] * 0.6 + hills[i - 1] * 0.2 + hills[i + 1] * 0.2;
      }
      hills = smoothed;
    };

    const rebuildSpecks = () => {
      // Кол-во “кристалликов” масштабируем от ширины
      const count = Math.floor(clamp(vw * 0.55, 180, 520));
      const rnd = mulberry32(speckSeed);

      specks = new Array(count).fill(0).map(() => ({
        x: rnd() * vw,
        // смещение относительно гребня (вверх/вниз в пределах верхней части холма)
        yOff: -(rnd() * (hillBand * 0.45) + 2),
        r: rnd() * 0.8 + 0.2,
        a: rnd() * 0.22 + 0.06,
      }));
    };

    const resizeToSection = () => {
      const rect = section.getBoundingClientRect();
      vw = rect.width;
      vh = rect.height;

      dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      flakesCount = vw < 420 ? 70 : vw < 1024 ? 100 : 120;

      rebuildHills();
      rebuildFlakes();
      rebuildSpecks();
    };

    // Плавная кривая холмов
    const drawSmoothHills = (offsetY: number, fillStyle: string) => {
      const baseY = vh;
      ctx.fillStyle = fillStyle;

      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(0, baseY - (hills[0] + offsetY));

      for (let i = 1; i < hills.length; i++) {
        const prevX = (i - 1) * step;
        const prevY = baseY - (hills[i - 1] + offsetY);

        const x = i * step;
        const y = baseY - (hills[i] + offsetY);

        const midX = (prevX + x) / 2;
        const midY = (prevY + y) / 2;

        ctx.quadraticCurveTo(prevX, prevY, midX, midY);
      }

      const lastX = (hills.length - 1) * step;
      const lastY = baseY - (hills[hills.length - 1] + offsetY);
      ctx.lineTo(lastX, lastY);

      ctx.lineTo(vw, baseY);
      ctx.closePath();
      ctx.fill();
    };

    // Текстура “кристаллики” возле гребня (без мерцания)
    const drawSnowSpecks = () => {
      const baseY = vh;

      // чуть мягче на мобилке
      const alphaMul = vw < 420 ? 0.75 : 1.0;

      // Рисуем маленькие точки в верхней части холмов
      for (let i = 0; i < specks.length; i++) {
        const s = specks[i];
        const idx = clamp(Math.floor(s.x / step), 0, hills.length - 1);
        const crestY = baseY - hills[idx];

        const y = crestY + s.yOff;

        // ограничим зону: только близко к гребню
        if (y > crestY + 8 || y < crestY - hillBand * 0.55) continue;

        ctx.globalAlpha = s.a * alphaMul;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const drawHills = () => {
      // основной слой
      drawSmoothHills(0, "rgba(255,255,255,0.96)");
      // подсветка
      drawSmoothHills(2, "rgba(255,255,255,0.22)");
      // тень
      drawSmoothHills(-6, "rgba(190,210,255,0.15)");

      // “зерно”/кристаллики
      drawSnowSpecks();
    };

    const animate = () => {
      ctx.clearRect(0, 0, vw, vh);

      drawHills();

      const wind = Math.sin(Date.now() * 0.00035) * (vw < 420 ? 0.16 : 0.28);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();

        f.y += f.vy;
        f.x += f.vx + wind;

        if (f.x < -10) f.x = vw + 10;
        if (f.x > vw + 10) f.x = -10;

        const idx = Math.floor(f.x / step);
        if (idx >= 0 && idx < hills.length) {
          const groundY = vh - hills[idx];
          if (f.y >= groundY) {
            flakes[i] = createFlake(false);
          }
        }

        if (f.y > vh + 20) flakes[i] = createFlake(false);
      }

      rafId = requestAnimationFrame(animate);
    };

    const ro = new ResizeObserver(() => resizeToSection());
    ro.observe(section);

    resizeToSection();
    rafId = requestAnimationFrame(animate);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-black text-white rounded-b-[20px] relative  min-h-[400px]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 30, width: "100%", height: "100%", display: "block" }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
        <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
          <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
            <h1 className="text-4xl sm:text-5xl md:text-[72px] font-[Raleway] font-medium leading-tight">
              Цифровое управление<br />территориями
            </h1>

            <p className="mt-8 text-xl sm:text-[27px] text-[#E3E8F2] max-w-2xl font-[Raleway] font-medium">
              Платформа для эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба
            </p>

            <div className="mt-10">
              <Button onClick={openDemo} variant="primary" size="large" className="w-full md:w-auto">
                Протестировать
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full h-full relative flex justify-center items-end lg:absolute lg:right-0 lg:bottom-[-80px] z-10 lg:w-[40%] lg:max-w-[600px] pointer-events-none">
            <Image
              src="/img/hero.webp"
              alt="Абстрактная иллюстрация цифрового управления"
              width={700}
              height={500}
              className="w-full max-w-[500px] lg:max-w-[600px] object-contain"
              priority
              sizes="(max-width: 1024px) 500px, 600px"
              style={{ height: "auto" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
