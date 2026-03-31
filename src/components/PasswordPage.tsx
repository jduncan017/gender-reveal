"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PasswordPageProps {
  family: string;
  familyTitle: string;
  labels: string[];
  subtitle: string;
  columns?: 1 | 2;
}

type FieldStatus = "idle" | "checking" | "wrong" | "correct";

export default function PasswordPage({
  family,
  familyTitle,
  labels,
  subtitle,
  columns = 1,
}: PasswordPageProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<string[]>(
    Array(labels.length).fill("") as string[],
  );
  const [statuses, setStatuses] = useState<FieldStatus[]>(
    Array(labels.length).fill("idle") as FieldStatus[],
  );
  const errorAudioRef = useRef<HTMLAudioElement>(null);
  const unlockAudioRef = useRef<HTMLAudioElement>(null);

  const allCorrect = statuses.every((s) => s === "correct");
  const [morphed, setMorphed] = useState(false);
  const [revealUrl, setRevealUrl] = useState<string | null>(null);

  // Trigger morph animation and fetch reveal URL after all answers are correct
  useEffect(() => {
    if (allCorrect && !morphed) {
      const timeout = setTimeout(() => setMorphed(true), 600);
      // Fetch the reveal URL from the server
      void fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family }),
      })
        .then((res) => res.json() as Promise<{ url?: string }>)
        .then((data) => {
          if (data.url) setRevealUrl(data.url);
        });
      return () => clearTimeout(timeout);
    }
  }, [allCorrect, morphed, family]);

  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    // Reset status if they edit after a wrong answer
    if (statuses[index] === "wrong") {
      setStatuses((prev) => {
        const next = [...prev];
        next[index] = "idle";
        return next;
      });
    }
  };

  const checkAnswer = async (index: number) => {
    if (answers[index]!.trim() === "" || statuses[index] === "correct") return;

    setStatuses((prev) => {
      const next = [...prev];
      next[index] = "checking";
      return next;
    });

    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family, index, answer: answers[index] }),
    });
    const data = (await res.json()) as { correct: boolean };

    if (data.correct) {
      setStatuses((prev) => {
        const next = [...prev];
        next[index] = "correct";
        return next;
      });
      if (unlockAudioRef.current) {
        unlockAudioRef.current.currentTime = 0;
        unlockAudioRef.current.volume = 0.5;
        void unlockAudioRef.current.play();
      }
    } else {
      setStatuses((prev) => {
        const next = [...prev];
        next[index] = "wrong";
        return next;
      });
      if (errorAudioRef.current) {
        errorAudioRef.current.currentTime = 0;
        errorAudioRef.current.volume = 0.5;
        void errorAudioRef.current.play();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void checkAnswer(index);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50">
      <audio ref={errorAudioRef} src="/error.mp3" preload="auto" />
      <audio ref={unlockAudioRef} src="/unlock.mp3" preload="auto" />

      {/* Header — full width navbar */}
      <div className="w-full bg-green-900 px-6 pt-20 pb-12 text-center shadow-lg shadow-green-900/20">
        <p className="mb-2 text-4xl">&#x1F476;</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          {familyTitle}
        </h1>
        <p className="mt-2 text-green-100">{subtitle}</p>
      </div>

      {/* Questions / Reveal — centered on page */}
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12">
        <div
          onClick={morphed && revealUrl ? () => router.push(revealUrl) : undefined}
          className={`relative w-full overflow-hidden text-center transition-all duration-1000 ease-in-out ${
            morphed
              ? "max-w-md cursor-pointer rounded-xl bg-green-500 px-8 py-6 shadow-lg shadow-green-200 hover:bg-green-600 hover:shadow-xl hover:shadow-green-300"
              : `${columns === 2 ? "max-w-5xl" : "max-w-2xl"} rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-20 py-16`
          } `}
        >
          {/* Questions content — fades out when morphed */}
          <div
            className={`transition-all duration-500 ${
              morphed
                ? "pointer-events-none max-h-0 opacity-0"
                : "max-h-[2000px] opacity-100"
            } `}
          >
            <div
              className={`grid gap-x-10 gap-y-10 ${columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
            >
              {labels.map((label, i) => {
                const status = statuses[i]!;
                const isCorrect = status === "correct";
                const isWrong = status === "wrong";
                const isChecking = status === "checking";

                return (
                  <div key={label} className="flex flex-col gap-2">
                    <label className="text-xl font-bold tracking-wider text-green-700">
                      {label}
                    </label>

                    {/* Input + button row */}
                    <div className="flex w-full items-stretch">
                      <input
                        type="text"
                        value={answers[i]}
                        onChange={(e) => updateAnswer(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        disabled={isCorrect}
                        placeholder="Enter answer..."
                        className={`min-w-0 flex-1 rounded-lg border-2 px-3 py-2.5 text-center text-base font-medium tracking-widest text-gray-700 uppercase placeholder-gray-400 transition-all duration-500 outline-none ${
                          isCorrect
                            ? "border-green-400 bg-green-100 text-green-700"
                            : isWrong
                              ? "animate-shake border-red-400 bg-red-50/50"
                              : "border-gray-200 bg-white focus:border-green-400"
                        } `}
                      />

                      {/* Check button — removed when correct */}
                      {!isCorrect && (
                        <button
                          type="button"
                          onClick={() => void checkAnswer(i)}
                          disabled={isChecking || answers[i]!.trim() === ""}
                          className="ml-2 shrink-0 cursor-pointer rounded-lg bg-green-700 px-4 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-40"
                        >
                          {isChecking ? "..." : "Check Me!"}
                        </button>
                      )}
                    </div>

                    {/* Status messages */}
                    {isWrong && (
                      <p className="animate-fade-in text-xs font-bold text-red-500">
                        &#x274C; Incorrect — try again!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress counter — shown below questions before morph */}
            {!allCorrect && (
              <div className="mt-8 text-lg font-bold text-gray-400">
                {statuses.filter((s) => s === "correct").length} / {labels.length} Answered
              </div>
            )}
          </div>

          {/* Reveal button text — fades in when morphed */}
          <div
            className={`transition-all delay-500 duration-500 ${
              morphed ? "opacity-100" : "pointer-events-none max-h-0 opacity-0"
            } `}
          >
            <p className="text-2xl font-extrabold text-white">
              {"\u{1F389}"} Unlock the Reveal!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
