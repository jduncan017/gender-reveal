"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CrosswordWord {
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
  clue: string;
}

interface CrosswordProps {
  rows: number;
  cols: number;
  words: CrosswordWord[];
  highlightedCells: [number, number][];
  onComplete: (highlightedWord: string) => void;
}

interface CellInfo {
  letter: string;
  acrossWord: number | null;
  downWord: number | null;
  number: number | null;
  isHighlighted: boolean;
}

function buildGrid(
  rows: number,
  cols: number,
  words: CrosswordWord[],
  highlightedCells: [number, number][],
) {
  const grid: (CellInfo | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );

  const highlightSet = new Set(highlightedCells.map(([r, c]) => `${r},${c}`));

  words.forEach((word, wordIdx) => {
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.direction === "down" ? word.row + i : word.row;
      const c = word.direction === "across" ? word.col + i : word.col;

      if (!grid[r]![c]) {
        grid[r]![c] = {
          letter: word.answer[i]!,
          acrossWord: null,
          downWord: null,
          number: null,
          isHighlighted: highlightSet.has(`${r},${c}`),
        };
      }

      const cellRef = grid[r]![c];
      if (!cellRef) continue;
      if (word.direction === "across") {
        cellRef.acrossWord = wordIdx;
      } else {
        cellRef.downWord = wordIdx;
      }
    }
  });

  let num = 1;
  const wordNumbers = new Map<number, number>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r]![c];
      if (!cell) continue;

      let needsNumber = false;
      for (let wi = 0; wi < words.length; wi++) {
        if (words[wi]!.row === r && words[wi]!.col === c) {
          needsNumber = true;
          wordNumbers.set(wi, num);
        }
      }

      if (needsNumber) {
        cell.number = num;
        num++;
      }
    }
  }

  const acrossClues: { number: number; clue: string; wordIdx: number }[] = [];
  const downClues: { number: number; clue: string; wordIdx: number }[] = [];

  words.forEach((word, idx) => {
    const clueNum = wordNumbers.get(idx)!;
    const entry = { number: clueNum, clue: word.clue, wordIdx: idx };
    if (word.direction === "across") {
      acrossClues.push(entry);
    } else {
      downClues.push(entry);
    }
  });

  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return { grid, acrossClues, downClues };
}

export default function Crossword({
  rows,
  cols,
  words,
  highlightedCells,
  onComplete,
}: CrosswordProps) {
  const { grid, acrossClues, downClues } = useMemo(
    () => buildGrid(rows, cols, words, highlightedCells),
    [rows, cols, words, highlightedCells],
  );

  const [userInput, setUserInput] = useState<string[][]>(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ""),
    ),
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [completed, setCompleted] = useState(false);
  const [incorrectCells, setIncorrectCells] = useState<Set<string>>(
    new Set(),
  );

  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)),
  );
  const errorAudioRef = useRef<HTMLAudioElement>(null);
  const unlockAudioRef = useRef<HTMLAudioElement>(null);

  // Active word cells
  const activeWordCells = useMemo(() => {
    if (!selectedCell) return new Set<string>();
    const [r, c] = selectedCell;
    const cell = grid[r]?.[c];
    if (!cell) return new Set<string>();

    const wordIdx =
      (direction === "across" ? cell.acrossWord : cell.downWord) ??
      (direction === "across" ? cell.downWord : cell.acrossWord);
    if (wordIdx === null) return new Set<string>();

    const word = words[wordIdx]!;
    const cells = new Set<string>();
    for (let i = 0; i < word.answer.length; i++) {
      const wr = word.direction === "down" ? word.row + i : word.row;
      const wc = word.direction === "across" ? word.col + i : word.col;
      cells.add(`${wr},${wc}`);
    }
    return cells;
  }, [selectedCell, direction, grid, words]);

  const activeClueIdx = useMemo(() => {
    if (!selectedCell) return null;
    const [r, c] = selectedCell;
    const cell = grid[r]?.[c];
    if (!cell) return null;
    return direction === "across"
      ? (cell.acrossWord ?? cell.downWord)
      : (cell.downWord ?? cell.acrossWord);
  }, [selectedCell, direction, grid]);

  const effectiveDirection = useMemo(() => {
    if (!selectedCell) return direction;
    const [r, c] = selectedCell;
    const cell = grid[r]?.[c];
    if (!cell) return direction;
    if (direction === "across" && cell.acrossWord !== null) return "across";
    if (direction === "down" && cell.downWord !== null) return "down";
    if (cell.acrossWord !== null) return "across";
    if (cell.downWord !== null) return "down";
    return direction;
  }, [selectedCell, direction, grid]);

  const checkCompletion = useCallback(
    (input: string[][]) => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r]![c];
          if (cell && input[r]![c]!.toUpperCase() !== cell.letter) {
            return false;
          }
        }
      }
      return true;
    },
    [grid, rows, cols],
  );

  const handleCheckAnswers = useCallback(() => {
    const wrong = new Set<string>();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]![c];
        if (!cell) continue;
        const val = userInput[r]![c]!.toUpperCase();
        if (val && val !== cell.letter) {
          wrong.add(`${r},${c}`);
        }
      }
    }
    setIncorrectCells(wrong);

    if (wrong.size > 0) {
      if (errorAudioRef.current) {
        errorAudioRef.current.currentTime = 0;
        void errorAudioRef.current.play();
      }
    } else if (checkCompletion(userInput)) {
      setCompleted(true);
      if (unlockAudioRef.current) {
        unlockAudioRef.current.currentTime = 0;
        void unlockAudioRef.current.play();
      }
      const highlightedWord = highlightedCells
        .map(([hr, hc]) => userInput[hr]![hc])
        .join("");
      onComplete(highlightedWord);
    } else {
      // No wrong cells but not complete — play unlock as positive feedback
      if (unlockAudioRef.current) {
        unlockAudioRef.current.currentTime = 0;
        void unlockAudioRef.current.play();
      }
    }
  }, [grid, rows, cols, userInput, checkCompletion, highlightedCells, onComplete]);

  const focusCell = useCallback((r: number, c: number) => {
    setTimeout(() => inputRefs.current[r]?.[c]?.focus(), 0);
  }, []);

  const advanceCell = useCallback(
    (r: number, c: number, dir: "across" | "down") => {
      const nr = dir === "down" ? r + 1 : r;
      const nc = dir === "across" ? c + 1 : c;
      if (nr < rows && nc < cols && grid[nr]?.[nc]) {
        setSelectedCell([nr, nc]);
        focusCell(nr, nc);
      }
    },
    [rows, cols, grid, focusCell],
  );

  const retreatCell = useCallback(
    (r: number, c: number, dir: "across" | "down") => {
      const nr = dir === "down" ? r - 1 : r;
      const nc = dir === "across" ? c - 1 : c;
      if (nr >= 0 && nc >= 0 && grid[nr]?.[nc]) {
        setSelectedCell([nr, nc]);
        focusCell(nr, nc);
      }
    },
    [grid, focusCell],
  );

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      const cell = grid[r]?.[c];
      if (!cell) return;

      // Clear incorrect highlight when user clicks to edit
      if (incorrectCells.size > 0) {
        setIncorrectCells(new Set());
      }

      if (selectedCell?.[0] === r && selectedCell?.[1] === c) {
        const newDir = direction === "across" ? "down" : "across";
        const hasNewDir =
          newDir === "across"
            ? cell.acrossWord !== null
            : cell.downWord !== null;
        if (hasNewDir) {
          setDirection(newDir);
        }
      } else {
        setSelectedCell([r, c]);
        if (cell.acrossWord !== null && cell.downWord !== null) {
          // keep direction
        } else if (cell.acrossWord !== null) {
          setDirection("across");
        } else if (cell.downWord !== null) {
          setDirection("down");
        }
      }
      focusCell(r, c);
    },
    [selectedCell, direction, grid, focusCell, incorrectCells.size],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, r: number, c: number) => {
      if (completed) return;
      const cell = grid[r]?.[c];
      if (!cell) return;

      // Clear incorrect highlights on any typing
      if (incorrectCells.size > 0) {
        setIncorrectCells(new Set());
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (userInput[r]![c]) {
          setUserInput((prev) => {
            const next = prev.map((row) => [...row]);
            next[r]![c] = "";
            return next;
          });
        } else {
          retreatCell(r, c, effectiveDirection);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        for (let nr = r - 1; nr >= 0; nr--) {
          if (grid[nr]?.[c]) {
            setSelectedCell([nr, c]);
            setDirection("down");
            focusCell(nr, c);
            break;
          }
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        for (let nr = r + 1; nr < rows; nr++) {
          if (grid[nr]?.[c]) {
            setSelectedCell([nr, c]);
            setDirection("down");
            focusCell(nr, c);
            break;
          }
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        for (let nc = c - 1; nc >= 0; nc--) {
          if (grid[r]?.[nc]) {
            setSelectedCell([r, nc]);
            setDirection("across");
            focusCell(r, nc);
            break;
          }
        }
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        for (let nc = c + 1; nc < cols; nc++) {
          if (grid[r]?.[nc]) {
            setSelectedCell([r, nc]);
            setDirection("across");
            focusCell(r, nc);
            break;
          }
        }
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const currentWordIdx =
          effectiveDirection === "across"
            ? cell.acrossWord
            : cell.downWord;
        const wordList =
          effectiveDirection === "across" ? acrossClues : downClues;
        const currentIdx = wordList.findIndex(
          (cl) => cl.wordIdx === currentWordIdx,
        );
        const nextIdx = (currentIdx + 1) % wordList.length;
        const nextWord = words[wordList[nextIdx]!.wordIdx]!;
        setSelectedCell([nextWord.row, nextWord.col]);
        focusCell(nextWord.row, nextWord.col);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toUpperCase();
        const newInput = userInput.map((row) => [...row]);
        newInput[r]![c] = letter;
        setUserInput(newInput);
        advanceCell(r, c, effectiveDirection);
      }
    },
    [
      grid,
      completed,
      userInput,
      effectiveDirection,
      rows,
      cols,
      incorrectCells.size,
      retreatCell,
      focusCell,
      advanceCell,
      acrossClues,
      downClues,
      words,
    ],
  );

  const handleClueClick = useCallback(
    (wordIdx: number) => {
      const word = words[wordIdx]!;
      setDirection(word.direction);
      setSelectedCell([word.row, word.col]);
      focusCell(word.row, word.col);
    },
    [words, focusCell],
  );

  // Focus first cell on mount
  useEffect(() => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]![c]) {
          setSelectedCell([r, c]);
          return;
        }
      }
    }
  }, [grid, rows, cols]);

  // Check if all white cells are filled
  const allFilled = useMemo(() => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]![c] && !userInput[r]![c]) return false;
      }
    }
    return true;
  }, [grid, rows, cols, userInput]);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <audio ref={errorAudioRef} src="/error.mp3" preload="auto" />
      <audio ref={unlockAudioRef} src="/unlock.mp3" preload="auto" />

      {/* Grid — centered */}
      <div className="shrink-0 overflow-x-auto">
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            width: `min(${cols * 48}px, 90vw)`,
          }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const cell = grid[r]![c];
              const key = `${r}-${c}`;
              const isSelected =
                selectedCell?.[0] === r && selectedCell?.[1] === c;
              const isActive = activeWordCells.has(`${r},${c}`);
              const isIncorrect = incorrectCells.has(`${r},${c}`);

              if (!cell) {
                return (
                  <div
                    key={key}
                    className="aspect-square border border-neutral-800 bg-green-950"
                  />
                );
              }

              return (
                <div
                  key={key}
                  className={`relative aspect-square border border-neutral-400 transition-colors ${
                    isSelected ? "z-10 ring-2 ring-green-500" : ""
                  } ${
                    isIncorrect
                      ? "animate-shake bg-red-200"
                      : completed && cell.isHighlighted
                        ? "bg-yellow-200"
                        : completed
                          ? "bg-green-100"
                          : isActive
                            ? "bg-green-100"
                            : "bg-white"
                  }`}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell.number && (
                    <span className="absolute top-0.5 left-1 text-[10px] leading-none font-bold text-neutral-500 sm:text-xs">
                      {cell.number}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[r]![c] = el;
                    }}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={1}
                    readOnly={completed}
                    value={userInput[r]![c] ?? ""}
                    onKeyDown={(e) => handleKeyDown(e, r, c)}
                    onFocus={() => setSelectedCell([r, c])}
                    onChange={() => undefined}
                    className="absolute inset-0 h-full w-full bg-transparent pt-2 text-center text-xl font-bold uppercase text-gray-800 caret-transparent outline-none sm:text-2xl"
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Clues — two columns below grid */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Down — left column */}
        <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 p-6 text-left">
          <h3 className="mb-3 border-b-2 border-green-800/10 pb-2 text-base font-extrabold tracking-wider text-green-800 uppercase">
            Down
          </h3>
          <ul className="space-y-0">
            {downClues.map((clue) => (
              <li
                key={clue.number}
                onClick={() => handleClueClick(clue.wordIdx)}
                className={`cursor-pointer border-b border-green-800/15 px-3 py-3 text-base transition-colors last:border-b-0 ${
                  activeClueIdx === clue.wordIdx &&
                  effectiveDirection === "down"
                    ? "rounded bg-green-800/5 font-semibold text-green-900"
                    : "text-gray-700 hover:bg-green-800/[0.02]"
                }`}
              >
                <span className="font-bold text-green-700">{clue.number}.</span>{" "}
                {clue.clue}
              </li>
            ))}
          </ul>
        </div>

        {/* Across — right column */}
        <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 p-6 text-left">
          <h3 className="mb-3 border-b-2 border-green-800/10 pb-2 text-base font-extrabold tracking-wider text-green-800 uppercase">
            Across
          </h3>
          <ul className="space-y-0">
            {acrossClues.map((clue) => (
              <li
                key={clue.number}
                onClick={() => handleClueClick(clue.wordIdx)}
                className={`cursor-pointer border-b border-green-800/15 px-3 py-3 text-base transition-colors last:border-b-0 ${
                  activeClueIdx === clue.wordIdx &&
                  effectiveDirection === "across"
                    ? "rounded bg-green-800/5 font-semibold text-green-900"
                    : "text-gray-700 hover:bg-green-800/[0.02]"
                }`}
              >
                <span className="font-bold text-green-700">{clue.number}.</span>{" "}
                {clue.clue}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Check Answers button */}
      {!completed && (
        <button
          onClick={handleCheckAnswers}
          disabled={!allFilled}
          className={`rounded-xl px-8 py-3 text-lg font-bold text-white transition-all ${
            allFilled
              ? "bg-green-700 hover:bg-green-800"
              : "cursor-not-allowed bg-gray-300"
          }`}
        >
          Check Answers
        </button>
      )}
    </div>
  );
}
