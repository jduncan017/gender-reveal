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
  cipherCell: [number, number] | null;
  onComplete: (highlightedWord: string, cipherLetter: string) => void;
  onActiveClueChange?: (clue: { prefix: string; text: string } | null) => void;
}

interface CellInfo {
  letter: string;
  acrossWord: number | null;
  downWord: number | null;
  number: number | null;
  isHighlighted: boolean;
  isCipher: boolean;
}

function buildGrid(
  rows: number,
  cols: number,
  words: CrosswordWord[],
  highlightedCells: [number, number][],
  cipherCell: [number, number] | null,
) {
  const grid: (CellInfo | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );

  const highlightSet = new Set(highlightedCells.map(([r, c]) => `${r},${c}`));
  const cipherKey = cipherCell ? `${cipherCell[0]},${cipherCell[1]}` : null;

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
          isCipher: `${r},${c}` === cipherKey,
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

// Get cells for a word
function getWordCells(word: CrosswordWord): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.direction === "down" ? word.row + i : word.row;
    const c = word.direction === "across" ? word.col + i : word.col;
    cells.push([r, c]);
  }
  return cells;
}

export default function Crossword({
  rows,
  cols,
  words,
  highlightedCells,
  cipherCell,
  onComplete,
  onActiveClueChange,
}: CrosswordProps) {
  const { grid, acrossClues, downClues } = useMemo(
    () => buildGrid(rows, cols, words, highlightedCells, cipherCell),
    [rows, cols, words, highlightedCells, cipherCell],
  );

  // Combined clue list for tab cycling: all across, then all down
  const allClues = useMemo(
    () => [...acrossClues, ...downClues],
    [acrossClues, downClues],
  );

  const [userInput, setUserInput] = useState<string[][]>(() =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")),
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [completed, setCompleted] = useState(false);
  const [incorrectCells, setIncorrectCells] = useState<Set<string>>(new Set());
  const [hintsRemaining, setHintsRemaining] = useState(5);
  const [hintedCells, setHintedCells] = useState<Set<string>>(new Set());

  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    ),
  );
  const errorAudioRef = useRef<HTMLAudioElement>(null);
  const unlockAudioRef = useRef<HTMLAudioElement>(null);

  // Get the current word index based on selected cell and direction
  const currentWordIdx = useMemo(() => {
    if (!selectedCell) return null;
    const [r, c] = selectedCell;
    const cell = grid[r]?.[c];
    if (!cell) return null;
    const idx =
      direction === "across"
        ? (cell.acrossWord ?? cell.downWord)
        : (cell.downWord ?? cell.acrossWord);
    return idx;
  }, [selectedCell, direction, grid]);

  // Get active clue info for header display
  const activeClueInfo = useMemo(() => {
    if (currentWordIdx === null) return null;
    const word = words[currentWordIdx]!;
    const clueList = word.direction === "across" ? acrossClues : downClues;
    const clue = clueList.find((c) => c.wordIdx === currentWordIdx);
    if (!clue) return null;
    return {
      prefix: `${clue.number} ${word.direction === "across" ? "Across" : "Down"}`,
      text: clue.clue,
    };
  }, [currentWordIdx, words, acrossClues, downClues]);

  // Notify parent of active clue changes
  useEffect(() => {
    onActiveClueChange?.(activeClueInfo);
  }, [activeClueInfo, onActiveClueChange]);

  // Active word cells
  const activeWordCells = useMemo(() => {
    if (currentWordIdx === null) return new Set<string>();
    const word = words[currentWordIdx]!;
    const cells = new Set<string>();
    for (const [wr, wc] of getWordCells(word)) {
      cells.add(`${wr},${wc}`);
    }
    return cells;
  }, [currentWordIdx, words]);

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
        errorAudioRef.current.volume = 0.5;
        void errorAudioRef.current.play();
      }
    } else if (checkCompletion(userInput)) {
      setCompleted(true);
      if (unlockAudioRef.current) {
        unlockAudioRef.current.currentTime = 0;
        unlockAudioRef.current.volume = 0.5;
        void unlockAudioRef.current.play();
      }
      const highlightedWord = highlightedCells
        .map(([hr, hc]) => userInput[hr]![hc])
        .join("");
      const cipherLetter = cipherCell
        ? (userInput[cipherCell[0]]![cipherCell[1]] ?? "")
        : "";
      onComplete(highlightedWord, cipherLetter);
    } else {
      if (unlockAudioRef.current) {
        unlockAudioRef.current.currentTime = 0;
        unlockAudioRef.current.volume = 0.5;
        void unlockAudioRef.current.play();
      }
    }
  }, [
    grid,
    rows,
    cols,
    userInput,
    checkCompletion,
    highlightedCells,
    cipherCell,
    onComplete,
  ]);

  const focusCell = useCallback((r: number, c: number) => {
    setTimeout(() => {
      const input = inputRefs.current[r]?.[c];
      if (input) {
        input.focus({ preventScroll: true });
        // Scroll the cell into view smoothly
        input.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }, 0);
  }, []);

  // Advance to next cell in a specific word, or jump to next word if at end
  const advanceInWord = useCallback(
    (r: number, c: number, wordIdx: number) => {
      const word = words[wordIdx]!;
      const cells = getWordCells(word);
      const myIdx = cells.findIndex(([cr, cc]) => cr === r && cc === c);

      if (myIdx + 1 < cells.length) {
        const [nr, nc] = cells[myIdx + 1]!;
        setSelectedCell([nr, nc]);
        focusCell(nr, nc);
      } else {
        // End of word — jump to next word in allClues cycle
        const currentIdx = allClues.findIndex((cl) => cl.wordIdx === wordIdx);
        const nextIdx = (currentIdx + 1) % allClues.length;
        const nextClue = allClues[nextIdx]!;
        const nextWord = words[nextClue.wordIdx]!;
        setDirection(nextWord.direction);

        const nextCells = getWordCells(nextWord);
        const emptyCell = nextCells.find(
          ([nr, nc]) => !userInput[nr]![nc],
        );
        const target = emptyCell ?? nextCells[0]!;
        setSelectedCell(target);
        focusCell(target[0], target[1]);
      }
    },
    [words, focusCell, allClues, userInput],
  );

  // Retreat within a specific word
  const retreatInWord = useCallback(
    (r: number, c: number, wordIdx: number) => {
      const word = words[wordIdx]!;
      const cells = getWordCells(word);
      const myIdx = cells.findIndex(([cr, cc]) => cr === r && cc === c);
      if (myIdx > 0) {
        const [nr, nc] = cells[myIdx - 1]!;
        setSelectedCell([nr, nc]);
        focusCell(nr, nc);
      }
    },
    [words, focusCell],
  );

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      const cell = grid[r]?.[c];
      if (!cell) return;

      if (incorrectCells.size > 0) {
        setIncorrectCells(new Set());
      }

      if (selectedCell?.[0] === r && selectedCell?.[1] === c) {
        // Toggle direction
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

      // Capture the current word index NOW, before any state changes
      const myWordIdx =
        direction === "across"
          ? (cell.acrossWord ?? cell.downWord)
          : (cell.downWord ?? cell.acrossWord);

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
        } else if (myWordIdx !== null) {
          retreatInWord(r, c, myWordIdx);
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
        // Cycle through all across then all down
        const currentIdx = allClues.findIndex(
          (cl) => cl.wordIdx === currentWordIdx,
        );
        const nextIdx = (currentIdx + 1) % allClues.length;
        const nextClue = allClues[nextIdx]!;
        const nextWord = words[nextClue.wordIdx]!;
        setDirection(nextWord.direction);

        // Jump to first empty cell in the next word
        const nextCells = getWordCells(nextWord);
        const emptyCell = nextCells.find(([nr, nc]) => !userInput[nr]![nc]);
        const target = emptyCell ?? nextCells[0]!;
        setSelectedCell(target);
        focusCell(target[0], target[1]);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toUpperCase();
        const newInput = userInput.map((row) => [...row]);
        newInput[r]![c] = letter;
        setUserInput(newInput);
        if (myWordIdx !== null) {
          advanceInWord(r, c, myWordIdx);
        }
      }
    },
    [
      grid,
      completed,
      userInput,
      rows,
      cols,
      incorrectCells.size,
      currentWordIdx,
      allClues,
      words,
      retreatInWord,
      focusCell,
      advanceInWord,
    ],
  );

  // Click a clue → jump to first empty cell in that word
  const handleClueClick = useCallback(
    (wordIdx: number) => {
      const word = words[wordIdx]!;
      setDirection(word.direction);

      const cells = getWordCells(word);
      const emptyCell = cells.find(([r, c]) => !userInput[r]![c]);
      const target = emptyCell ?? cells[0]!;
      setSelectedCell(target);
      focusCell(target[0], target[1]);
    },
    [words, focusCell, userInput],
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

  const handleHint = useCallback(() => {
    if (hintsRemaining <= 0) return;

    // Find all empty or incorrect cells
    const candidates: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]![c];
        if (!cell) continue;
        const val = userInput[r]![c]!.toUpperCase();
        if (!val || val !== cell.letter) {
          candidates.push([r, c]);
        }
      }
    }

    if (candidates.length === 0) return;

    // Pick a random one
    const [hr, hc] = candidates[Math.floor(Math.random() * candidates.length)]!;
    const cell = grid[hr]![hc]!;

    setUserInput((prev) => {
      const next = prev.map((row) => [...row]);
      next[hr]![hc] = cell.letter;
      return next;
    });
    setHintsRemaining((h) => h - 1);
    setHintedCells((prev) => new Set([...prev, `${hr},${hc}`]));

    if (unlockAudioRef.current) {
      unlockAudioRef.current.currentTime = 0;
      void unlockAudioRef.current.play();
    }
  }, [hintsRemaining, rows, cols, grid, userInput]);

  const allFilled = useMemo(() => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]![c] && !userInput[r]![c]) return false;
      }
    }
    return true;
  }, [grid, rows, cols, userInput]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <audio ref={errorAudioRef} src="/error.mp3" preload="auto" />
      <audio ref={unlockAudioRef} src="/unlock.mp3" preload="auto" />

      {/* Grid + Clues */}
      <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-6">
        {/* Grid wrapper */}
        <div className="relative shrink-0">
          {/* Floating clue modal — below active cell, mobile only */}
          {activeClueInfo && selectedCell && !completed && (
            <div
              className="pointer-events-none absolute left-0 z-30 w-full px-1 lg:hidden"
              style={{
                top: `calc(${((selectedCell[0] + 1) / rows) * 100}% + 0.5rem)`,
              }}
            >
              <div className="pointer-events-auto rounded-lg bg-black/90 px-3 py-2 text-center shadow-lg">
                <p className="text-sm leading-snug text-white">
                  <span className="font-medium text-white/70">{activeClueInfo.prefix}:</span>{" "}
                  {activeClueInfo.text}
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <div
              className="grid gap-0 bg-green-950"
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
                  const isHinted = hintedCells.has(`${r},${c}`);

                  if (!cell) {
                    return (
                      <div key={key} className="aspect-square bg-green-950" />
                    );
                  }

                  return (
                    <div
                      key={key}
                      style={{ boxShadow: "inset 0 0 0 1px #a3a3a3" }}
                      className={`relative aspect-square transition-colors ${
                        isIncorrect
                          ? "animate-shake bg-red-200"
                          : completed && cell.isCipher
                            ? "bg-orange-300 ring-2 ring-orange-400"
                            : completed && cell.isHighlighted
                              ? "bg-yellow-200"
                              : completed
                                ? "bg-green-100"
                                : isSelected
                                  ? "z-10 bg-yellow-300 ring-3 ring-yellow-500"
                                  : isActive
                                    ? "bg-green-200"
                                    : "bg-white"
                      }`}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {cell.number && (
                        <span className="absolute top-px left-0.5 text-[7px] leading-none font-bold text-neutral-500 sm:top-0.5 sm:left-1 sm:text-[10px] md:text-xs">
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
                        className={`absolute inset-0 h-full w-full bg-transparent pt-1 text-center text-base font-bold uppercase caret-transparent outline-none sm:pt-2 sm:text-xl md:text-2xl ${
                          isHinted ? "text-yellow-600" : "text-gray-800"
                        }`}
                      />
                    </div>
                  );
                }),
              )}
            </div>
          </div>
          {/* end overflow-x-auto */}
        </div>
        {/* end grid wrapper */}

        {/* Clues — hidden on mobile (shown in floating modal), visible on desktop */}
        <div className="hidden w-full min-w-0 flex-1 rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 p-6 text-left lg:block">
          <h3 className="mb-3 border-b-2 border-green-800/10 pb-2 text-base font-extrabold tracking-wider text-green-800 uppercase">
            Down
          </h3>
          <ul className="mb-6 space-y-0">
            {downClues.map((clue) => (
              <li
                key={clue.number}
                onClick={() => handleClueClick(clue.wordIdx)}
                className={`cursor-pointer border-b border-green-800/15 px-3 py-3 text-base transition-colors last:border-b-0 ${
                  currentWordIdx === clue.wordIdx
                    ? "rounded bg-green-800/5 font-semibold text-green-900"
                    : "text-gray-700 hover:bg-green-800/[0.02]"
                }`}
              >
                <span className="font-bold text-green-700">{clue.number}.</span>{" "}
                {clue.clue}
              </li>
            ))}
          </ul>

          <h3 className="mb-3 border-b-2 border-green-800/10 pb-2 text-base font-extrabold tracking-wider text-green-800 uppercase">
            Across
          </h3>
          <ul className="space-y-0">
            {acrossClues.map((clue) => (
              <li
                key={clue.number}
                onClick={() => handleClueClick(clue.wordIdx)}
                className={`cursor-pointer border-b border-green-800/15 px-3 py-3 text-base transition-colors last:border-b-0 ${
                  currentWordIdx === clue.wordIdx
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
      {/* end grid + clues flex row */}

      {!completed && (
        <div className="flex items-center gap-4">
          {hintsRemaining > 0 && (
            <button
              onClick={handleHint}
              className="rounded-xl bg-amber-600 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-amber-700"
            >
              Hint ({hintsRemaining})
            </button>
          )}
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
        </div>
      )}
    </div>
  );
}
