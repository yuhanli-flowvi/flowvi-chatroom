import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

type TransitionOverlayProps = {
  isActive: boolean;
  onTransitionMiddle: () => void;
  onTransitionEnd: () => void;
};

export default function TransitionOverlay({
  isActive,
  onTransitionMiddle,
  onTransitionEnd,
}: TransitionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const speedRef = useRef(0);

  const onMiddleRef = useRef(onTransitionMiddle);
  const onEndRef = useRef(onTransitionEnd);

  // Always keep refs up to date
  onMiddleRef.current = onTransitionMiddle;
  onEndRef.current = onTransitionEnd;

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Star data
    const starCount = 800;
    const stars: { x: number; y: number; z: number; o: number }[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        o: Math.random(), // initial offset
      });
    }

    let startTime = Date.now();
    speedRef.current = 0.5; // Initial drift speed

    const render = () => {
      // Clear with trail effect for motion blur
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Acceleration logic
      const elapsed = Date.now() - startTime;
      
      // Phase 1: Accelerate (0-400ms)
      if (elapsed < 400) {
        speedRef.current += 5; // Extreme acceleration
      } 
      // Phase 2: Decelerate (400ms+)
      else if (elapsed > 600) {
        speedRef.current *= 0.8; // Fast stop
      }

      // Max speed cap
      if (speedRef.current > 150) speedRef.current = 150;

      // Draw stars
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < starCount; i++) {
        const star = stars[i];
        
        // Move star
        star.z -= speedRef.current;

        // Reset if passed camera
        if (star.z <= 0) {
          star.z = canvas.width;
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
        }

        // Projection
        const k = 128.0 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        // Size based on proximity and speed
        const size = (1 - star.z / canvas.width) * 4 + (speedRef.current / 20);
        
        // Draw
        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
            const alpha = (1 - star.z / canvas.width);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    // Timing triggers
    const middleTimer = setTimeout(() => {
        if (onMiddleRef.current) onMiddleRef.current();
      }, 400); // Switch at 0.4s

    const endTimer = setTimeout(() => {
        if (onEndRef.current) onEndRef.current();
      }, 800); // End at 0.8s

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(middleTimer);
      clearTimeout(endTimer);
    };
  }, [isActive]); // Only dependency is isActive to prevent restart

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 z-[100] bg-black pointer-events-none rounded-[40px] overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />
          {/* Vignette Overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-50" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
