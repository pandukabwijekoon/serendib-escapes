"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useSmoothScroll } from "@/components/SmoothScrollProvider";

interface IslandScrollytellingProps {
  onStartCustomItinerary: () => void;
}

interface VehicleAssets {
  suvSide: HTMLImageElement | null;
  suvRearWheel: HTMLCanvasElement | null;
  suvFrontWheel: HTMLCanvasElement | null;
  suvTop: HTMLImageElement | null;
  oceanBg: HTMLImageElement | null;
  yachtTop: HTMLCanvasElement | null;
  jetTop: HTMLImageElement | null;
}

// Sub-pixel measured wheel centers & alloy rim radius on suv-side.jpg (1376x768)
const SUV_REAR_WHEEL = { cx: 0.2594, cy: 0.7337 };
const SUV_FRONT_WHEEL = { cx: 0.7896, cy: 0.7344 };
const SUV_RIM_RADIUS_RATIO = 0.096; // relative to naturalHeight (fits cleanly inside black tire)
const SUV_TIRE_RADIUS_RATIO = 0.125; // outer tire radius for exact zero-slip rolling physics

const STAGES = [
  { id: 0, code: "01", label: "Airport Pickup", progressTarget: 0.06 },
  { id: 1, code: "02", label: "Road Trip", progressTarget: 0.34 },
  { id: 2, code: "03", label: "Boat Tours", progressTarget: 0.62 },
  { id: 3, code: "04", label: "Flights", progressTarget: 0.84 },
  { id: 4, code: "05", label: "Reviews", progressTarget: 0.98 },
] as const;

const TESTIMONIALS = [
  {
    initials: "CL",
    quote:
      "As a first-time visitor to Sri Lanka, everything was so easy and well organized—from airport pickup in Colombo to climbing Sigiriya at sunrise and watching whales in Mirissa.",
    author: "Claire & Henrik Lindqvist",
    origin: "Zurich, Switzerland • Foreign Visitors",
  },
  {
    initials: "DP",
    quote:
      "Serendib Escapes made our family holiday to Ella and Yala completely stress-free. The Sri Lankan local prices were very fair, the hotels were clean and comfortable, and our driver was super friendly.",
    author: "Dilshan & Nethmi Perera",
    origin: "Colombo, Sri Lanka • Local Family Trip",
  },
  {
    initials: "MT",
    quote:
      "Taking a quick flight over the southern beaches and arriving straight at our beachfront hotel saved us hours and made this our best holiday ever.",
    author: "Marcus Thorne",
    origin: "London, United Kingdom • Custom Trip",
  },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function isImgReady(img: HTMLImageElement | null): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/**
 * Extracts a circular photorealistic alloy rim directly from suv-side.jpg
 * with a soft 3px outer edge feather so it rotates seamlessly inside the tire.
 */
function createWheelSpriteCanvas(
  img: HTMLImageElement,
  cxNorm: number,
  cyNorm: number
): HTMLCanvasElement {
  const r = Math.round(img.naturalHeight * SUV_RIM_RADIUS_RATIO);
  const size = r * 2;
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const octx = off.getContext("2d");
  if (!octx) return off;

  const srcX = img.naturalWidth * cxNorm - r;
  const srcY = img.naturalHeight * cyNorm - r;
  octx.drawImage(img, srcX, srcY, size, size, 0, 0, size, size);

  octx.globalCompositeOperation = "destination-in";
  const mask = octx.createRadialGradient(r, r, r * 0.88, r, r, r);
  mask.addColorStop(0, "rgba(0, 0, 0, 1)");
  mask.addColorStop(0.92, "rgba(0, 0, 0, 0.96)");
  mask.addColorStop(1, "rgba(0, 0, 0, 0)");
  octx.fillStyle = mask;
  octx.fillRect(0, 0, size, size);

  return off;
}

/**
 * Extracts the overhead yacht + natural white frothy wake from yacht-top.jpg
 * by smoothly keying out its dark-blue background water and applying an exact
 * elliptical edge fade, so the yacht floats seamlessly on the full-screen sea
 * with zero rectangular seams.
 */
function createFeatheredYachtCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement("canvas");
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (!octx) return off;

  octx.drawImage(img, 0, 0);

  const imageData = octx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let y = 0; y < h; y++) {
    const ny = (y / h - 0.5) / 0.47;
    const yNorm = y / h;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // True elliptical edge mask (guarantees 0 alpha well before all 4 edges)
      const nx = (x / w - 0.5) / 0.44;
      const ellipseDist = Math.sqrt(nx * nx + ny * ny);
      const edgeFade = 1 - smoothstep(0.62, 0.98, ellipseDist);

      if (edgeFade <= 0.001) {
        data[idx + 3] = 0;
        continue;
      }

      // Check if pixel is inside the central yacht hull footprint (protect dark bridge glass)
      const xDistFromCenter = Math.abs(x / w - 0.5);
      const inHullY = yNorm > 0.16 && yNorm < 0.83;
      const hullHalfWidth = yNorm < 0.3 ? lerp(0.03, 0.115, (yNorm - 0.14) / 0.16) : 0.115;
      const isInsideHullCore = inHullY && xDistFromCenter < hullHalfWidth;

      if (isInsideHullCore) {
        data[idx + 3] = Math.round(255 * edgeFade);
        continue;
      }

      // Outside hull core: keep bright white wake foam, smoothly key out dark sapphire water
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const blueness = b - r;

      // Dark blue ocean water has low luminance and strong blue dominance
      const waterKey =
        smoothstep(18, 52, blueness) * (1 - smoothstep(75, 165, lum));
      const wakeAlpha = clamp01(1 - waterKey * 0.98);

      data[idx + 3] = Math.round(255 * wakeAlpha * edgeFade);
    }
  }

  octx.putImageData(imageData, 0, 0);
  return off;
}

function drawScrollytellingFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  assets: VehicleAssets
) {
  ctx.clearRect(0, 0, w, h);

  // =========================================================================
  // BEAT 1 (0.00 - 0.24): CRISP WHITE GALLERY + REALISTIC RANGE ROVER SIDE-VIEW
  // =========================================================================
  if (p < 0.28) {
    const t = clamp01(p / 0.24);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // Subtle architectural grid watermark
    ctx.strokeStyle = "rgba(15, 23, 42, 0.035)";
    ctx.lineWidth = 1;
    const step = 76;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Dark asphalt road band along bottom
    const roadTop = lerp(h * 0.74, h * 0.66, smoothstep(0.65, 1, t));
    ctx.fillStyle = "#0D1110";
    ctx.fillRect(0, roadTop, w, h - roadTop);

    // Subtle gold curb edge
    ctx.fillStyle = "rgba(212, 175, 55, 0.55)";
    ctx.fillRect(0, roadTop, w, 2);

    // Subtle moving road dashes on asphalt for true forward speed feel
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 2;
    ctx.setLineDash([28, 44]);
    ctx.lineDashOffset = t * 340;
    ctx.beginPath();
    ctx.moveTo(0, roadTop + (h - roadTop) * 0.36);
    ctx.lineTo(w, roadTop + (h - roadTop) * 0.36);
    ctx.stroke();
    ctx.restore();

    // Photorealistic obsidian-black Range Rover Autobiography with physically rolling alloy wheels
    if (isImgReady(assets.suvSide)) {
      const img = assets.suvSide;
      const isMobile = w < 640;
      const targetW = isMobile ? Math.min(w * 0.88, 380) : Math.min(w * 0.54, 620);
      const targetH = targetW * (img.naturalHeight / img.naturalWidth);
      const startX = isMobile ? w * 0.36 : w * 0.28;
      const endX = isMobile ? w * 0.62 : w * 0.56;
      const vehX = lerp(startX, endX, t);
      const suspensionMicroBounce = Math.sin(t * Math.PI * 8) * 0.6;
      // Align tires cleanly onto roadTop (tires sit ~84.5% down the 16:9 studio frame)
      const vehLeft = vehX - targetW / 2;
      const vehTop = roadTop - targetH * 0.845 + suspensionMicroBounce;

      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(img, vehLeft, vehTop, targetW, targetH);
      ctx.restore();

      // Physically accurate zero-slip wheel rotation: theta = distance / outerTireRadius
      const outerTireRadius = targetH * SUV_TIRE_RADIUS_RATIO;
      const wheelAngle = (vehX - startX) / Math.max(1, outerTireRadius);
      const rimDrawRadius = targetH * SUV_RIM_RADIUS_RATIO;

      const wheels: Array<{
        sprite: HTMLCanvasElement | null;
        cx: number;
        cy: number;
      }> = [
        {
          sprite: assets.suvRearWheel,
          cx: vehLeft + targetW * SUV_REAR_WHEEL.cx,
          cy: vehTop + targetH * SUV_REAR_WHEEL.cy,
        },
        {
          sprite: assets.suvFrontWheel,
          cx: vehLeft + targetW * SUV_FRONT_WHEEL.cx,
          cy: vehTop + targetH * SUV_FRONT_WHEEL.cy,
        },
      ];

      wheels.forEach(({ sprite, cx, cy }) => {
        if (!sprite) return;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(wheelAngle);
        ctx.drawImage(
          sprite,
          -rimDrawRadius,
          -rimDrawRadius,
          rimDrawRadius * 2,
          rimDrawRadius * 2
        );
        ctx.restore();

        // Stationary top-down studio light sheen so reflections stay natural while spokes spin
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rimDrawRadius, 0, Math.PI * 2);
        ctx.clip();
        const sheen = ctx.createLinearGradient(
          cx,
          cy - rimDrawRadius,
          cx,
          cy + rimDrawRadius
        );
        sheen.addColorStop(0, "rgba(255, 255, 255, 0.09)");
        sheen.addColorStop(0.5, "rgba(255, 255, 255, 0)");
        sheen.addColorStop(1, "rgba(0, 0, 0, 0.14)");
        ctx.fillStyle = sheen;
        ctx.fillRect(
          cx - rimDrawRadius,
          cy - rimDrawRadius,
          rimDrawRadius * 2,
          rimDrawRadius * 2
        );
        ctx.restore();
      });
    }
  }

  // =========================================================================
  // BEAT 2 (0.24 - 0.51): 90° ROTATION -> VERTICAL BLACK HIGHWAY + TOP-DOWN SUV
  // =========================================================================
  if (p >= 0.24 && p < 0.51) {
    const t = clamp01((p - 0.24) / 0.26);
    const rotateProgress = smoothstep(0.0, 0.36, t);
    const driveProgress = smoothstep(0.26, 1.0, t);

    // Crisp white gallery background
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, w, h);

    // Rotating & centering sleek black vertical highway strip
    const roadWidth = w < 640 ? Math.min(w * 0.36, 154) : Math.min(w * 0.17, 196);
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate(lerp(Math.PI / 2, 0, rotateProgress));

    ctx.fillStyle = "#0D1110";
    ctx.fillRect(
      -roadWidth / 2,
      -Math.max(w, h),
      roadWidth,
      Math.max(w, h) * 2
    );

    // Crisp lane shoulders
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(-roadWidth / 2 + 10, -Math.max(w, h), 2, Math.max(w, h) * 2);
    ctx.fillRect(roadWidth / 2 - 12, -Math.max(w, h), 2, Math.max(w, h) * 2);

    // Animated dashed center divider moving downward as vehicle drives up
    ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([22, 26]);
    ctx.lineDashOffset = -driveProgress * 460;
    ctx.beginPath();
    ctx.moveTo(0, -Math.max(w, h));
    ctx.lineTo(0, Math.max(w, h));
    ctx.stroke();
    ctx.setLineDash([]);

    // Photorealistic top-down pearl-white Range Rover driving smoothly up the black highway
    const carY = lerp(h * 0.26, -h * 0.22, driveProgress);

    // Warm LED headlight beam cone ahead on the asphalt
    const beam = ctx.createRadialGradient(0, carY - 70, 6, 0, carY - 140, 120);
    beam.addColorStop(0, "rgba(254, 240, 138, 0.30)");
    beam.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-22, carY - 62);
    ctx.lineTo(-58, carY - 210);
    ctx.lineTo(58, carY - 210);
    ctx.lineTo(22, carY - 62);
    ctx.closePath();
    ctx.fill();

    if (isImgReady(assets.suvTop)) {
      const img = assets.suvTop;
      const drawW = roadWidth * 0.72;
      const drawH = drawW * (img.naturalHeight / img.naturalWidth);
      ctx.save();
      ctx.globalCompositeOperation = "lighten";
      ctx.drawImage(img, -drawW / 2, carY - drawH / 2, drawW, drawH);
      ctx.restore();
    }
    ctx.restore();
  }

  // =========================================================================
  // BEAT 3 (0.495 - 0.79): FULL-BLEED EXPANDING DRONE SEA + REAL SUPERYACHT ZOOM-OUT
  // =========================================================================
  if (p >= 0.495 && p < 0.79) {
    const t = clamp01((p - 0.5) / 0.28);
    const enterAlpha = smoothstep(0.495, 0.515, p);
    const exitAlpha = 1 - smoothstep(0.765, 0.785, p);

    ctx.save();
    ctx.globalAlpha = enterAlpha * exitAlpha;

    // Fallback base ocean color while texture loads
    ctx.fillStyle = "#03264E";
    ctx.fillRect(0, 0, w, h);

    // Full-bleed edge-to-edge real drone ocean texture that smoothly zooms out & drifts
    if (isImgReady(assets.oceanBg)) {
      const sea = assets.oceanBg;
      const zoomFactor = lerp(1.26, 1.02, smoothstep(0.0, 1.0, t));
      const coverScale =
        Math.max(w / sea.naturalWidth, h / sea.naturalHeight) * zoomFactor;
      const seaW = sea.naturalWidth * coverScale;
      const seaH = sea.naturalHeight * coverScale;
      const driftY = lerp(-seaH * 0.04, seaH * 0.04, t);

      ctx.drawImage(
        sea,
        (w - seaW) / 2,
        (h - seaH) / 2 + driftY,
        seaW,
        seaH
      );

      // Subtle atmospheric deep-blue edge vignette for crisp white typography readability
      const vig = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        Math.min(w, h) * 0.2,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.72
      );
      vig.addColorStop(0, "rgba(3, 30, 62, 0.04)");
      vig.addColorStop(1, "rgba(2, 18, 40, 0.48)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    // Photorealistic overhead superyacht zooming out seamlessly over the expanding sea
    if (assets.yachtTop) {
      const yachtCanvas = assets.yachtTop;
      const baseH = h * lerp(1.28, 0.48, smoothstep(0.04, 0.92, t));
      const baseW = baseH * (yachtCanvas.width / yachtCanvas.height);
      const yachtY = lerp(h * 0.52, h * 0.56, t);
      ctx.drawImage(
        yachtCanvas,
        w * 0.5 - baseW / 2,
        yachtY - baseH / 2,
        baseW,
        baseH
      );
    }

    ctx.restore();
  }

  // =========================================================================
  // BEAT 4 (0.77 - 1.00): CRISP WHITE GALLERY + REAL GULFSTREAM G700 JET WIPE
  // =========================================================================
  if (p >= 0.77) {
    const whiteBgAlpha = smoothstep(0.77, 0.79, p);

    ctx.save();
    ctx.globalAlpha = whiteBgAlpha;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Giant photorealistic Gulfstream G700 private jet sweeping cleanly below the upper headline
    if (p >= 0.78 && p <= 0.95 && isImgReady(assets.jetTop)) {
      const img = assets.jetTop;
      const flyT = clamp01((p - 0.78) / 0.16);
      const drawW = w < 640 ? Math.max(w * 1.18, 420) : Math.max(w * 0.88, 760);
      const drawH = drawW * (img.naturalHeight / img.naturalWidth);
      const planeX = lerp(w * 1.32, -w * 0.36, flyT);
      const planeY = lerp(h * 0.61, h * 0.66, flyT);

      ctx.save();
      ctx.translate(planeX, planeY);
      ctx.rotate(-0.04);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }
  }
}

export function IslandScrollytelling({
  onStartCustomItinerary,
}: IslandScrollytellingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const circleProgressRef = useRef<SVGCircleElement | null>(null);
  const progressValueRef = useRef<number>(0);

  const assetsRef = useRef<VehicleAssets>({
    suvSide: null,
    suvRearWheel: null,
    suvFrontWheel: null,
    suvTop: null,
    oceanBg: null,
    yachtTop: null,
    jetTop: null,
  });

  const [activeStage, setActiveStage] = useState<number>(0);
  const { scrollTo } = useSmoothScroll();

  const renderFrame = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    drawScrollytellingFrame(ctx, width, height, progress, assetsRef.current);
    ctx.restore();
  }, []);

  // Preload all 4 photorealistic studio/drone vehicle assets
  useEffect(() => {
    let cancelled = false;
    const sources: Array<[
      "suvSide" | "suvTop" | "oceanBg" | "yachtTop" | "jetTop",
      string
    ]> = [
      ["suvSide", "/images/vehicles/suv-side.jpg"],
      ["suvTop", "/images/vehicles/suv-top.jpg"],
      ["oceanBg", "/images/vehicles/ocean-bg.jpg"],
      ["yachtTop", "/images/vehicles/yacht-top.jpg"],
      ["jetTop", "/images/vehicles/jet-top.jpg"],
    ];

    sources.forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        if (key === "yachtTop") {
          assetsRef.current.yachtTop = createFeatheredYachtCanvas(img);
        } else if (key === "suvSide") {
          assetsRef.current.suvSide = img;
          assetsRef.current.suvRearWheel = createWheelSpriteCanvas(
            img,
            SUV_REAR_WHEEL.cx,
            SUV_REAR_WHEEL.cy
          );
          assetsRef.current.suvFrontWheel = createWheelSpriteCanvas(
            img,
            SUV_FRONT_WHEEL.cx,
            SUV_FRONT_WHEEL.cy
          );
        } else {
          assetsRef.current[key] = img;
        }
        renderFrame(progressValueRef.current);
      };
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [renderFrame]);

  // GSAP ScrollTrigger 500vh pinned scrubbed choreography
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const container = containerRef.current;
    if (!container) return;

    renderFrame(0);

    const circumference = 2 * Math.PI * 18;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.45,
        onUpdate: (self) => {
          const p = self.progress;
          progressValueRef.current = p;

          if (circleProgressRef.current) {
            circleProgressRef.current.style.strokeDashoffset = String(
              circumference * (1 - p)
            );
          }

          renderFrame(p);

          const nextStage =
            p < 0.24 ? 0 : p < 0.495 ? 1 : p < 0.755 ? 2 : p < 0.9 ? 3 : 4;
          setActiveStage((prev) => (prev === nextStage ? prev : nextStage));
        },
      });
    }, container);

    const handleResize = () => renderFrame(progressValueRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ctx.revert();
    };
  }, [renderFrame]);

  function jumpToStage(targetProgress: number) {
    const container = containerRef.current;
    if (!container) return;
    const top = container.offsetTop;
    const scrollable = container.offsetHeight - window.innerHeight;
    scrollTo(top + scrollable * targetProgress);
  }

  const isLightStage = activeStage !== 2;

  return (
    <section
      id="journey"
      ref={containerRef}
      aria-label="Serendib Escapes Scrollytelling Showcase"
      className="relative h-[500vh] w-full bg-[#FFFFFF]"
    >
      {/* Sticky Pinned 100dvh Stage (safe across mobile Safari/Chrome toolbars) */}
      <div
        className={`sticky top-0 h-[100dvh] w-full overflow-hidden transition-colors duration-300 ${
          isLightStage ? "bg-[#FFFFFF]" : "bg-[#021836]"
        }`}
      >
        {/* High-DPI 120fps Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* Editorial Stage Overlays */}
        <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-center px-4 sm:px-14">
          <AnimatePresence mode="wait">
            {/* BEAT 1: CRISP WHITE ARRIVAL */}
            {activeStage === 0 && (
              <motion.div
                key="beat-arrival"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto flex h-full w-full max-w-7xl flex-col justify-between pt-24 pb-16 sm:pt-28 sm:pb-12"
              >
                <div className="max-w-3xl">
                  <span className="text-xs font-semibold text-[#9A7B2C] sm:text-sm">
                    Serendib Escapes • Sri Lanka Travel
                  </span>
                  <h1 className="mt-2 font-serif text-4xl font-semibold leading-[1.02] tracking-tight text-[#0A0F0D] sm:text-7xl">
                    Travel Sri Lanka Easily.
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base">
                    Scroll down to see how we take care of your entire trip—from
                    airport pickup and private car rides to boat tours and local
                    flights.
                  </p>
                </div>

                <div className="flex items-end justify-between text-white">
                  <div className="max-w-xs sm:max-w-sm">
                    <p className="text-xs font-semibold text-[#D4AF37]">
                      Private Car Service
                    </p>
                    <p className="mt-0.5 text-xs text-white/85 sm:mt-1 sm:text-sm">
                      Friendly airport pickup directly to your hotel.
                    </p>
                  </div>
                  <span className="hidden text-sm font-medium text-white/75 sm:block">
                    Scroll down to explore ↓
                  </span>
                </div>
              </motion.div>
            )}

            {/* BEAT 2: VERTICAL HIGHWAY + BOLD LEFT EDITORIAL TYPOGRAPHY */}
            {activeStage === 1 && (
              <motion.div
                key="beat-highway"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto flex h-full w-full max-w-7xl flex-col justify-start pt-24 md:grid md:h-auto md:grid-cols-12 md:items-center md:gap-8 md:pt-0"
              >
                <div className="rounded-2xl border border-black/5 bg-white/85 p-5 shadow-sm backdrop-blur-md md:col-span-5 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
                  <span className="text-xs font-semibold text-[#9A7B2C] sm:text-sm">
                    Step 2 • Comfortable Road Trips
                  </span>
                  <h2 className="mt-1.5 font-serif text-3xl font-semibold leading-[1.05] tracking-tight text-[#0A0F0D] sm:mt-2 sm:text-6xl">
                    Safe &amp; Easy
                    <br className="hidden md:inline" /> Rides Across
                    <br className="hidden md:inline" /> Sri Lanka.
                  </h2>
                  <p className="mt-2.5 max-w-sm text-xs leading-relaxed text-slate-600 sm:mt-4 sm:text-base">
                    Clean, air-conditioned private vehicles with experienced
                    local drivers connecting Sigiriya, Ella, Yala, and the
                    Southern Beaches.
                  </p>
                </div>

                <div className="hidden md:col-span-2 md:block" />

                <div className="hidden md:col-span-5 md:block md:pl-8">
                  <div className="space-y-5 border-l border-slate-300 pl-6">
                    <div>
                      <span className="block text-xs font-medium text-slate-500">
                        Popular Route
                      </span>
                      <span className="mt-1 block font-serif text-2xl font-semibold text-[#0A0F0D]">
                        Colombo → Sigiriya → Ella
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-500">
                        Available For
                      </span>
                      <span className="mt-1 block text-base font-medium text-slate-700">
                        Foreign Visitors &amp; Sri Lankan Locals
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BEAT 3: DEEP SAPPHIRE OCEAN + SYMMETRIC CALLOUTS AROUND YACHT */}
            {activeStage === 2 && (
              <motion.div
                key="beat-ocean"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="mx-auto flex h-full w-full max-w-7xl flex-col justify-between pt-20 pb-20 text-white sm:py-24"
              >
                <div className="text-center drop-shadow-[0_2px_18px_rgba(2,12,24,0.8)]">
                  <span className="text-xs font-semibold text-[#D4AF37] sm:text-sm">
                    Step 3 • Mirissa &amp; Southern Beaches
                  </span>
                  <h2 className="mt-1.5 font-serif text-3xl font-semibold leading-tight tracking-tight text-white sm:mt-2 sm:text-6xl">
                    Relax by the Ocean
                    <br />
                    &amp; Sunny Beaches.
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-12 md:gap-6">
                  <div className="contents md:col-span-4 md:block md:space-y-6">
                    <div className="rounded-xl border border-white/10 bg-[#021836]/65 p-3 backdrop-blur-sm md:max-w-xs md:rounded-none md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                      <p className="text-xs font-semibold text-[#D4AF37] sm:text-sm">
                        Private Boat Rides
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-sky-100/85 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                        Calm morning boat trips along the Mirissa coastline.
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#021836]/65 p-3 backdrop-blur-sm md:max-w-xs md:rounded-none md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                      <p className="text-xs font-semibold text-[#D4AF37] sm:text-sm">
                        Beachfront Hotels
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-sky-100/85 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                        Peaceful ocean-view rooms just steps from the sand.
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:col-span-4 md:block" />

                  <div className="contents md:col-span-4 md:block md:space-y-6 md:text-right">
                    <div className="rounded-xl border border-white/10 bg-[#021836]/65 p-3 backdrop-blur-sm md:ml-auto md:max-w-xs md:rounded-none md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                      <p className="text-xs font-semibold text-[#D4AF37] sm:text-sm">
                        Whale Watching Trips
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-sky-100/85 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                        Spot blue whales and dolphins with local guides.
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#021836]/65 p-3 backdrop-blur-sm md:ml-auto md:max-w-xs md:rounded-none md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                      <p className="text-xs font-semibold text-[#D4AF37] sm:text-sm">
                        24/7 Customer Support
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-sky-100/85 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                        Instant WhatsApp and phone help throughout your trip.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BEAT 4: AVIATION SWEEP TRANSITION */}
            {activeStage === 3 && (
              <motion.div
                key="beat-aviation"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-full w-full items-start justify-center pt-24 sm:pt-28"
              >
                <div className="mx-auto max-w-3xl rounded-2xl border border-black/5 bg-white/80 px-5 py-3.5 text-center shadow-sm backdrop-blur-md sm:px-8 sm:py-5">
                  <span className="text-xs font-semibold text-[#9A7B2C] sm:text-sm">
                    Step 4 • Local Flights
                  </span>
                  <h2 className="mt-1 font-serif text-2xl font-semibold text-[#0A0F0D] sm:mt-1.5 sm:text-5xl lg:text-6xl">
                    Quick Flights Across Sri Lanka.
                  </h2>
                </div>
              </motion.div>
            )}

            {/* BEAT 5: CRISP WHITE EDITORIAL TESTIMONIALS */}
            {activeStage === 4 && (
              <motion.div
                key="beat-stories"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto mx-auto max-h-[78dvh] w-full max-w-5xl overflow-y-auto pt-12 pb-6 sm:pt-10"
              >
                <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:mb-8 sm:flex-row sm:items-end sm:gap-4 sm:pb-6">
                  <div>
                    <span className="text-xs font-semibold text-[#9A7B2C] sm:text-sm">
                      Guest Reviews
                    </span>
                    <h2 className="mt-1 font-serif text-2xl font-semibold text-[#0A0F0D] sm:text-5xl">
                      What Our Travelers Say
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onStartCustomItinerary}
                    className="inline-flex items-center gap-2 self-start rounded-full bg-[#0A0F0D] px-5 py-2.5 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#1A2420] sm:px-6 sm:py-3 sm:text-sm"
                  >
                    <span>Plan Your Trip</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {TESTIMONIALS.map((item) => (
                    <div
                      key={item.author}
                      className="grid gap-2.5 py-3.5 sm:grid-cols-12 sm:items-start sm:gap-4 sm:py-5"
                    >
                      <div className="flex items-center gap-3 sm:col-span-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A0F0D] font-serif text-xs font-semibold text-[#D4AF37] sm:h-11 sm:w-11 sm:text-sm">
                          {item.initials}
                        </div>
                        <div>
                          <p className="font-serif text-base font-semibold text-[#0A0F0D] sm:text-lg">
                            {item.author}
                          </p>
                          <p className="text-[11px] text-slate-500 sm:text-xs">
                            {item.origin}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 sm:col-span-8 sm:text-sm">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slim Right-Edge Quick-Reserve Tab */}
        <button
          type="button"
          onClick={onStartCustomItinerary}
          className="no-print fixed top-1/2 right-0 z-30 hidden -translate-y-1/2 rounded-l-xl bg-[#D4AF37] px-2.5 py-5 text-xs font-bold tracking-wider text-[#0A0F0D] shadow-xl transition hover:bg-[#E7C660] md:block"
          style={{ writingMode: "vertical-rl" }}
        >
          Book Now
        </button>

        {/* Bottom-Center Minimal Stage HUD (Mobile + Desktop) + Bottom-Right Circular Scroll Progress */}
        <div className="no-print absolute inset-x-0 bottom-4 z-20 flex items-center justify-between px-4 sm:bottom-5 sm:px-10">
          <div
            className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 backdrop-blur-md transition-colors sm:gap-4 sm:px-4 sm:py-2 ${
              isLightStage
                ? "border-slate-300/80 bg-white/85 text-slate-700"
                : "border-white/15 bg-[#0A0F0D]/60 text-white/80"
            }`}
          >
            {STAGES.map((stage) => {
              const active = activeStage === stage.id;
              return (
                <button
                  key={stage.code}
                  type="button"
                  onClick={() => jumpToStage(stage.progressTarget)}
                  className={`text-[11px] font-medium transition-colors sm:text-xs ${
                    active
                      ? isLightStage
                        ? "font-semibold text-[#9A7B2C]"
                        : "font-semibold text-[#D4AF37]"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <span>{stage.code}</span>
                  <span className="hidden sm:inline">. {stage.label}</span>
                </button>
              );
            })}
          </div>

          {/* Circular Scroll Progress Ring */}
          <div className="ml-auto flex items-center gap-2">
            <svg
              className="h-11 w-11 -rotate-90"
              viewBox="0 0 44 44"
              aria-hidden="true"
            >
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke={
                  isLightStage
                    ? "rgba(15, 23, 42, 0.14)"
                    : "rgba(255, 255, 255, 0.2)"
                }
                strokeWidth="2"
              />
              <circle
                ref={circleProgressRef}
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
