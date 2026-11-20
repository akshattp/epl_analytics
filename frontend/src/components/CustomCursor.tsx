"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [cursorType, setCursorType] = useState<"default" | "hover" | "view" | "drag">("default");
  const [cursorLabel, setCursorLabel] = useState("");

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const cursorX = useSpring(-100, springConfig);
  const cursorY = useSpring(-100, springConfig);

  useEffect(() => {
    // Only enable on desktop pointer devices
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isFinePointer || prefersReducedMotion) {
      return;
    }

    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Inspect hovered target for interactive cues
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest("a, button, [role='button'], [data-cursor]");
      if (interactive) {
        const customType = interactive.getAttribute("data-cursor");
        const customLabel = interactive.getAttribute("data-cursor-label");

        if (customType === "view") {
          setCursorType("view");
          setCursorLabel(customLabel || "VIEW");
        } else if (customType === "drag") {
          setCursorType("drag");
          setCursorLabel(customLabel || "DRAG");
        } else {
          setCursorType("hover");
          setCursorLabel("");
        }
      } else {
        setCursorType("default");
        setCursorLabel("");
      }
    };

    const handleMouseLeave = () => {
      cursorX.set(-100);
      cursorY.set(-100);
      setCursorType("default");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cursorX, cursorY]);

  if (!enabled) return null;

  const isExpanded = cursorType !== "default";

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden hidden md:block">
      {/* Trailing Aura Ring */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: cursorType === "view" ? 64 : isExpanded ? 48 : 24,
          height: cursorType === "view" ? 64 : isExpanded ? 48 : 24,
          backgroundColor: cursorType === "view"
            ? "rgba(255, 75, 53, 0.95)"
            : isExpanded
            ? "rgba(255, 75, 53, 0.15)"
            : "rgba(255, 75, 53, 0.05)",
          borderColor: isExpanded ? "rgba(255, 75, 53, 0.8)" : "rgba(241, 235, 221, 0.4)",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="rounded-full border flex items-center justify-center backdrop-blur-[1px] transition-colors"
      >
        {cursorLabel && (
          <span className="text-[10px] font-display font-extrabold text-[#F1EBDD] tracking-widest uppercase">
            {cursorLabel}
          </span>
        )}
      </motion.div>

      {/* Center Precision Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isExpanded ? 0 : 1,
          opacity: isExpanded ? 0 : 1,
        }}
        className="w-1.5 h-1.5 bg-[#FF4B35] rounded-full shadow-sm"
      />
    </div>
  );
}
