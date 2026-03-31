"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";

type Phase = "loading" | "tap" | "countdown" | "reveal";

const PINK_COLORS = ["#ff69b4", "#ff1493", "#ffb6c1", "#ff85a2", "#ffc0cb"];
const NEUTRAL_COLORS = ["#22c55e", "#16a34a", "#facc15", "#eab308", "#a3e635"];

function fireRevealConfetti() {
  const duration = 6000;
  const end = Date.now() + duration;

  const frame = () => {
    void confetti({
      particleCount: 4,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.6 },
      colors: PINK_COLORS,
    });
    void confetti({
      particleCount: 4,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.6 },
      colors: PINK_COLORS,
    });
    void confetti({
      particleCount: 3,
      angle: 90,
      spread: 120,
      origin: { x: 0.5, y: 0.4 },
      colors: PINK_COLORS,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  void confetti({
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: PINK_COLORS,
    startVelocity: 45,
    gravity: 0.8,
    ticks: 300,
  });

  frame();
}

function fireNeutralConfetti() {
  void confetti({
    particleCount: 8,
    angle: 270,
    spread: 140,
    origin: { x: Math.random(), y: -0.1 },
    colors: NEUTRAL_COLORS,
    gravity: 1.2,
    drift: (Math.random() - 0.5) * 0.5,
    ticks: 200,
    startVelocity: 10,
  });
}

export default function RevealPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [countdown, setCountdown] = useState(10);
  const revealAudioRef = useRef<HTMLAudioElement>(null);
  const drumrollAudioRef = useRef<HTMLAudioElement>(null);
  const neutralConfettiRef = useRef<number | null>(null);

  const startReveal = useCallback(() => {
    setPhase("reveal");

    // Stop neutral confetti
    if (neutralConfettiRef.current) {
      cancelAnimationFrame(neutralConfettiRef.current);
      neutralConfettiRef.current = null;
    }

    // Clear any remaining neutral confetti
    void confetti.reset();

    // Small delay so the reset clears, then fire pink
    setTimeout(() => {
      fireRevealConfetti();
    }, 50);

    // Start reveal music right away — drumroll keeps playing and fades naturally
    if (revealAudioRef.current) {
      revealAudioRef.current.currentTime = 0;
      revealAudioRef.current.volume = 0.5;
      void revealAudioRef.current.play();
    }
  }, []);

  // Loading phase — show spinner for 3 seconds, then show tap screen
  useEffect(() => {
    if (phase !== "loading") return;
    const timeout = setTimeout(() => setPhase("tap"), 3000);
    return () => clearTimeout(timeout);
  }, [phase]);

  // Countdown phase — neutral confetti
  useEffect(() => {
    if (phase !== "countdown") return;

    const interval = setInterval(() => {
      fireNeutralConfetti();
    }, 100);

    return () => {
      clearInterval(interval);
      if (neutralConfettiRef.current) {
        cancelAnimationFrame(neutralConfettiRef.current);
      }
    };
  }, [phase]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      startReveal();
      return;
    }
    const timeout = setTimeout(() => setCountdown((c) => c - 1), 909);
    return () => clearTimeout(timeout);
  }, [phase, countdown, startReveal]);

  const handleTap = () => {
    if (phase === "tap") {
      // Start drumroll immediately on tap (user gesture unlocks both audio elements)
      if (drumrollAudioRef.current) {
        drumrollAudioRef.current.currentTime = 0;
        drumrollAudioRef.current.volume = 0.7;
        void drumrollAudioRef.current.play();
      }
      // Also "warm up" the reveal audio so it's ready to play later without gesture
      if (revealAudioRef.current) {
        revealAudioRef.current.volume = 0;
        void revealAudioRef.current.play().then(() => {
          revealAudioRef.current!.pause();
          revealAudioRef.current!.currentTime = 0;
          revealAudioRef.current!.volume = 0.5;
        });
      }
      setPhase("countdown");
    }
  };

  return (
    <>
      {/* Persistent audio elements — never unmounted */}
      <audio ref={drumrollAudioRef} src="/drumroll.mp3" preload="auto" />
      <audio ref={revealAudioRef} src="/reveal-music.m4a" preload="auto" />

      {/* ── LOADING PHASE ── */}
      {phase === "loading" && (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 via-yellow-50 to-green-50">
          <div className="text-center">
            <div className="mx-auto mb-6 animate-suspense-pulse">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6l4 2"
                />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <p className="animate-pulse text-xl font-semibold text-green-600">
              Loading something special...
            </p>
          </div>
        </main>
      )}

      {/* ── TAP PHASE ── */}
      {phase === "tap" && (
        <main
          className="flex min-h-screen cursor-pointer flex-col items-center justify-center bg-gradient-to-b from-green-50 via-yellow-50 to-green-50"
          onClick={handleTap}
        >
          <div className="animate-bounce text-center">
            <p className="mb-2 text-5xl">&#x1F476;</p>
            <p className="mb-2 text-2xl font-bold text-green-600">
              Tap anywhere to reveal!
            </p>
            <p className="text-green-500/70">
              &#x1F50A; Sound on for the best experience
            </p>
          </div>
        </main>
      )}

      {/* ── COUNTDOWN PHASE ── */}
      {phase === "countdown" && (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 via-yellow-50 to-green-50">
          <div className="text-center">
            <p className="mb-4 text-xl font-medium tracking-widest text-green-600">
              Get ready...
            </p>
            <div
              key={countdown}
              className="animate-countdown-pop text-9xl font-extrabold text-yellow-500 sm:text-[12rem]"
            >
              {countdown}
            </div>
          </div>
        </main>
      )}

      {/* ── REVEAL PHASE ── */}
      {phase === "reveal" && (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-pink-100 via-white to-pink-100">
          {/* Floating hearts background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-float text-pink-200"
                style={{
                  left: `${(i * 5 + 7) % 100}%`,
                  top: `${(i * 13 + 3) % 100}%`,
                  fontSize: `${(i % 4) * 8 + 18}px`,
                  animationDelay: `${(i % 5) * 1.1}s`,
                  animationDuration: `${(i % 4) + 5}s`,
                }}
              >
                &#x2764;
              </div>
            ))}
          </div>

          {/* Main reveal text */}
          <div className="relative z-10 text-center">
            <p className="mb-4 animate-fade-in text-2xl font-medium tracking-widest text-pink-400 sm:text-3xl">
              Introducing...
            </p>
            <h1
              className="animate-reveal bg-gradient-to-r from-pink-400 via-rose-500 to-pink-400 bg-clip-text text-6xl font-extrabold text-transparent sm:text-8xl md:text-9xl"
              style={{ animationDelay: "0.5s" }}
            >
              IT&apos;S A GIRL!
            </h1>
            <div
              className="mt-8 animate-fade-in text-5xl"
              style={{ animationDelay: "1.5s" }}
            >
              &#x1F380; &#x1F338; &#x1F49D; &#x1F338; &#x1F380;
            </div>
          </div>
        </main>
      )}
    </>
  );
}
