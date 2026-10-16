import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
  opacity: number;
}

const COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444",
];

export function useConfetti() {
  const fire = () => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    const particles: Particle[] = [];

    for (let i = 0; i < 160; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4 - canvas.height * 0.1,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? "rect" : "circle",
        opacity: 1,
      });
    }

    let frame = 0;
    const MAX_FRAMES = 150;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - frame / MAX_FRAMES);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (frame < MAX_FRAMES) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    };

    requestAnimationFrame(animate);
  };

  return { fire };
}

const MILESTONES: Record<number, { emoji: string; message: string }> = {
  7:   { emoji: "🔥", message: "7-day streak! You're on fire!" },
  10:  { emoji: "⭐", message: "10 days in a row! Great momentum!" },
  15:  { emoji: "⚡", message: "15 days strong! Incredible momentum!" },
  20:  { emoji: "💪", message: "20 days! Habit officially formed!" },
  25:  { emoji: "🌟", message: "25 days! Almost a full month!" },
  30:  { emoji: "🏆", message: "30-day streak! A full month of consistency!" },
  50:  { emoji: "💎", message: "50 days! You're a habit machine!" },
  100: { emoji: "🚀", message: "100-DAY STREAK! Legendary dedication!" },
};

export function getMilestone(streak: number) {
  return MILESTONES[streak] ?? null;
}

/** Returns the highest milestone crossed when streak grew from prevStreak to newStreak. */
export function getCrossedMilestone(prevStreak: number, newStreak: number) {
  const crossed = (Object.keys(MILESTONES) as unknown as number[])
    .map(Number)
    .filter((n) => n > prevStreak && n <= newStreak)
    .sort((a, b) => b - a); // highest first
  return crossed.length > 0 ? MILESTONES[crossed[0]] : null;
}
