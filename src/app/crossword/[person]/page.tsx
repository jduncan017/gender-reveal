"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import confetti from "canvas-confetti";
import Crossword from "~/components/Crossword";
import crosswords from "~/crosswords.json";

const NEUTRAL_COLORS = ["#22c55e", "#16a34a", "#facc15", "#eab308", "#a3e635"];

function fireNeutralConfetti() {
  const duration = 4000;
  const end = Date.now() + duration;

  const frame = () => {
    void confetti({
      particleCount: 4,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.6 },
      colors: NEUTRAL_COLORS,
    });
    void confetti({
      particleCount: 4,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.6 },
      colors: NEUTRAL_COLORS,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  void confetti({
    particleCount: 100,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: NEUTRAL_COLORS,
    startVelocity: 40,
    gravity: 0.8,
    ticks: 250,
  });

  frame();
}

type PersonKey = keyof typeof crosswords;

const validPeople = new Set<string>(Object.keys(crosswords));

export default function CrosswordPage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person } = use(params);
  const [phase, setPhase] = useState<"landing" | "puzzle" | "done">("landing");
  const [secretWord, setSecretWord] = useState("");

  useEffect(() => {
    if (phase === "done") {
      fireNeutralConfetti();
    }
  }, [phase]);

  if (!validPeople.has(person)) {
    notFound();
  }

  const data = crosswords[person as PersonKey];

  if (data.words.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50 px-4">
        <div className="text-center">
          <p className="mb-4 text-4xl">&#x1F6A7;</p>
          <h1 className="text-2xl font-extrabold text-green-700">
            {data.name}&apos;s Crossword
          </h1>
          <p className="mt-2 text-green-600">Coming soon!</p>
        </div>
      </main>
    );
  }

  // Landing
  if (phase === "landing") {
    return (
      <main className="flex min-h-screen flex-col items-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50">
        <div className="w-full bg-green-900 px-6 pt-16 pb-10 text-center shadow-lg shadow-green-900/20">
          <p className="mb-2 text-4xl">&#x1F9E9;</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            {data.name}&apos;s Crossword
          </h1>
          <p className="mt-2 text-green-100">
            We made you a personalized crossword puzzle!
          </p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <p className="mb-8 max-w-md text-center text-lg leading-relaxed text-green-600">
            Solve the puzzle to unlock a special surprise. Take your time — no
            rush!
          </p>
          <button
            onClick={() => setPhase("puzzle")}
            className="rounded-xl bg-green-700 px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-green-800"
          >
            Start Puzzle
          </button>
        </div>
      </main>
    );
  }

  // Done
  if (phase === "done") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50 px-4">
        <div className="max-w-lg text-center">
          <p className="mb-4 animate-fade-in text-5xl">&#x1F389;</p>
          <h1 className="mb-6 animate-fade-in text-3xl font-extrabold text-green-700">
            Puzzle Complete!
          </h1>

          <p className="mb-3 animate-fade-in text-lg text-green-600">
            Your secret word is:
          </p>

          {/* Animated letter reveal */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {secretWord.split("").map((letter, i) => (
              <span
                key={i}
                className="animate-reveal inline-block rounded-lg bg-yellow-200 px-3 py-3 text-3xl font-extrabold tracking-widest text-green-900 sm:px-4 sm:text-4xl"
                style={{ animationDelay: `${i * 0.15 + 0.5}s` }}
              >
                {letter}
              </span>
            ))}
          </div>

          <div
            className="animate-fade-in rounded-xl bg-green-800/5 px-6 py-4"
            style={{
              animationDelay: `${secretWord.length * 0.15 + 1}s`,
            }}
          >
            <p className="text-base font-semibold text-green-800">
              &#x1F4DD; Remember this word!
            </p>
            <p className="mt-1 text-sm text-green-600">
              You&apos;ll need it to help unlock the big reveal.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Puzzle
  return (
    <main className="flex min-h-screen flex-col items-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50">
      <div className="w-full bg-green-900 px-6 pt-16 pb-10 text-center shadow-lg shadow-green-900/20">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          {data.name}&apos;s Crossword
        </h1>
        <p className="mt-2 text-green-100">
          Fill in the grid to unlock a surprise
        </p>
      </div>

      <div className="flex w-full max-w-6xl flex-1 items-start px-4 py-6 sm:items-center sm:px-6 sm:py-8">
        <Crossword
          rows={data.rows}
          cols={data.cols}
          words={
            data.words as {
              answer: string;
              row: number;
              col: number;
              direction: "across" | "down";
              clue: string;
            }[]
          }
          highlightedCells={data.highlightedCells as [number, number][]}
          onComplete={(word) => {
            setSecretWord(word);
            setTimeout(() => setPhase("done"), 1500);
          }}
        />
      </div>
    </main>
  );
}
