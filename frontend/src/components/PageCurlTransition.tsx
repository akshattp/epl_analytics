"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Theme = "light" | "dark";

interface CurlTransitionContextType {
  isCurling: boolean;
  targetTheme: Theme | null;
  startCurl: (nextTheme: Theme, onComplete: () => void) => void;
}

const CurlContext = createContext<CurlTransitionContextType>({
  isCurling: false,
  targetTheme: null,
  startCurl: () => {},
});

export function useCurlTransition() {
  return useContext(CurlContext);
}

export function PageCurlProvider({ children }: { children: React.ReactNode }) {
  const [isCurling, setIsCurling] = useState(false);
  const [targetTheme, setTargetTheme] = useState<Theme | null>(null);

  const startCurl = useCallback((nextTheme: Theme, onComplete: () => void) => {
    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }

    setTargetTheme(nextTheme);
    setIsCurling(true);

    // Mid-point: update actual theme class at peak peel
    const timer1 = setTimeout(() => {
      onComplete();
    }, 320);

    // End transition
    const timer2 = setTimeout(() => {
      setIsCurling(false);
      setTargetTheme(null);
    }, 680);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <CurlContext.Provider value={{ isCurling, targetTheme, startCurl }}>
      {children}
      <AnimatePresence>
        {isCurling && targetTheme && (
          <PageCurlOverlay targetTheme={targetTheme} />
        )}
      </AnimatePresence>
    </CurlContext.Provider>
  );
}

function PageCurlOverlay({ targetTheme }: { targetTheme: Theme }) {
  // Is peeling to light or peeling to dark?
  const isTargetLight = targetTheme === "light";

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 
        The Underneath Layer:
        Fills the screen with the upcoming theme surface color as the curl peels away.
      */}
      <motion.div
        initial={{
          clipPath: "polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)",
        }}
        animate={{
          clipPath: [
            "polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)",
            "polygon(60% 0%, 100% 0%, 100% 40%, 80% 20%)",
            "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          ],
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute inset-0 ${
          isTargetLight
            ? "bg-[#F1EBDD]"
            : "bg-[#111318]"
        }`}
      />

      {/* 
        The Peeling Sheet Backface & Corner Fold:
        A 3D perspective folding corner originating from top-right (100% 0%)
        sweeping diagonally across the viewport.
      */}
      <motion.div
        initial={{
          x: "10%",
          y: "-10%",
          scale: 0.2,
          rotate: -25,
          opacity: 0.9,
        }}
        animate={{
          x: ["10%", "-40%", "-120%"],
          y: ["-10%", "40%", "120%"],
          scale: [0.2, 1.2, 2.5],
          rotate: [-25, -15, 0],
          opacity: [0.95, 0.9, 0],
        }}
        transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 right-0 w-[140vw] h-[140vh] origin-top-right"
        style={{
          perspective: 1200,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Curled sheet with realistic luxury ivory/obsidian sheen, vermilion edge & drop shadow */}
        <div
          className={`w-full h-full ${
            isTargetLight
              ? "bg-gradient-to-bl from-[#181A20] via-[#111318] to-transparent border-b-2 border-[#FF4B35]"
              : "bg-gradient-to-bl from-[#FAF7F0] via-[#F1EBDD] to-transparent border-b-2 border-[#FF4B35]"
          }`}
          style={{
            boxShadow: isTargetLight
              ? "-20px 20px 60px rgba(0, 0, 0, 0.8), -5px 5px 20px rgba(255, 75, 53, 0.2)"
              : "-20px 20px 60px rgba(17, 19, 24, 0.25), -5px 5px 20px rgba(255, 75, 53, 0.15)",
            filter: "blur(0.5px)",
          }}
        />

        {/* Dynamic Crease Highlight Line */}
        <div
          className={`absolute inset-0 w-2 h-full ${
            isTargetLight
              ? "bg-gradient-to-b from-blue-400/40 via-cyan-300/30 to-transparent"
              : "bg-gradient-to-b from-blue-600/30 via-cyan-500/20 to-transparent"
          }`}
          style={{
            transform: "rotate(45deg) translate(-50%, -50%)",
            transformOrigin: "center center",
          }}
        />
      </motion.div>
    </div>
  );
}
