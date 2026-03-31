"use client";

import { useState, useEffect, useMemo, use } from "react";
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
  const [cipherLetter, setCipherLetter] = useState("");

  useEffect(() => {
    if (phase === "done") {
      fireNeutralConfetti();
    }
  }, [phase]);

  if (!validPeople.has(person)) {
    notFound();
  }

  const data = crosswords[person as PersonKey];

  // Find which index in the secret word is the cipher letter
  const cipherIndex = useMemo(() => {
    if (!("cipherCell" in data) || !data.cipherCell) return -1;
    const [cr, cc] = data.cipherCell as [number, number];
    const cells = data.highlightedCells as [number, number][];
    return cells.findIndex(([r, c]) => r === cr && c === cc);
  }, [data]);

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

          {/* Animated letter reveal — cipher letter highlighted inline */}
          <div className="mb-8 flex justify-center gap-1.5 sm:gap-2">
            {secretWord.split("").map((letter, i) => {
              const isCipher = i === cipherIndex;
              return (
                <span
                  key={i}
                  className={`animate-reveal inline-block rounded-lg px-2 py-2 text-2xl font-extrabold tracking-widest sm:px-3 sm:py-3 sm:text-3xl ${
                    isCipher
                      ? "bg-orange-300 text-orange-900 ring-2 ring-orange-400"
                      : "bg-yellow-200 text-green-900"
                  }`}
                  style={{ animationDelay: `${i * 0.15 + 0.5}s` }}
                >
                  {letter}
                </span>
              );
            })}
          </div>

          {cipherLetter && (
            <p
              className="animate-fade-in mb-8 text-base text-green-600"
              style={{
                animationDelay: `${secretWord.length * 0.15 + 1}s`,
              }}
            >
              The highlighted letter{" "}
              <span className="inline-block rounded bg-orange-300 px-1.5 py-0.5 font-extrabold text-orange-900">
                {cipherLetter}
              </span>{" "}
              is your secret letter
            </p>
          )}

          <div
            className="animate-fade-in rounded-xl bg-green-800/5 px-6 py-4"
            style={{
              animationDelay: `${secretWord.length * 0.15 + 1.5}s`,
            }}
          >
            <p className="text-base font-semibold text-green-800">
              &#x1F4DD; Remember your word and your letter!
            </p>
            <p className="mt-1 text-sm text-green-600">
              You&apos;ll need both to help unlock the big reveal.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Landing + Puzzle (combined for animation)
  const isLanding = phase === "landing";

  return (
    <main className="flex min-h-screen flex-col items-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50">
      {/* Header — centered on landing, slides to top on puzzle */}
      <div
        className={`bg-green-900 text-center shadow-lg shadow-green-900/20 transition-all duration-700 ease-in-out ${
          isLanding
            ? "mt-[30vh] w-[calc(100%-2rem)] max-w-lg rounded-lg px-6 py-10 sm:px-12"
            : "mt-0 w-full max-w-full rounded-none px-6 pt-16 pb-10"
        }`}
      >
        <p className="mb-2 text-4xl">&#x1F9E9;</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          {data.name}&apos;s Crossword
        </h1>
        <p className="mt-2 text-green-100">
          {isLanding
            ? "We made you a personalized crossword puzzle!"
            : "Fill in the grid to unlock a surprise"}
        </p>

        {/* Landing content — inside the card */}
        <div
          className={`overflow-hidden transition-all duration-700 ${
            isLanding ? "mt-6 max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <p className="mb-6 text-base leading-relaxed text-green-200">
            Solve the puzzle to unlock a special surprise. Take your time — no
            rush!
          </p>
          <button
            onClick={() => setPhase("puzzle")}
            className="rounded-xl bg-green-600 px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-green-500"
          >
            Start Puzzle
          </button>
        </div>
      </div>

      {/* Puzzle — fades in after header animates up */}
      <div
        className={`w-full max-w-6xl flex-1 items-start px-4 py-6 transition-all duration-700 sm:items-center sm:px-6 sm:py-8 ${
          isLanding ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
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
          cipherCell={
            "cipherCell" in data
              ? (data.cipherCell as [number, number])
              : null
          }
          onComplete={(word, cipher) => {
            setSecretWord(word);
            setCipherLetter(cipher);
            setTimeout(() => setPhase("done"), 1500);
          }}
        />
      </div>
    </main>
  );
}
