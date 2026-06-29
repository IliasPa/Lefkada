"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Share2, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { KEYS, storageGet, storageSet } from "@/lib/storage";

const GREEK_LETTERS = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ".split("");
const MAX_ATTEMPTS = 6;

interface GameState {
  targetWord: string;
  guesses: string[];
  gameOver: boolean;
  won: boolean;
  shareGrid?: string;
}

interface Streak {
  wins: number;
  losses: number;
  current: number;
}

function getdailyWord(answers: string[]): string {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return answers[seed % answers.length] || answers[0];
}

export default function GameTab() {
  const { t, lang } = useApp();
  const [gameState, setGameState] = useState<GameState>({
    targetWord: "",
    guesses: [],
    gameOver: false,
    won: false,
  });
  const [streak, setStreak] = useState<Streak>({
    wins: 0,
    losses: 0,
    current: 0,
  });
  const [words, setWords] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [error, setError] = useState("");
  const [copyNotif, setCopyNotif] = useState(false);

  // Load word lists
  useEffect(() => {
    const loadWords = async () => {
      try {
        const [wordsRes, answersRes] = await Promise.all([
          fetch("/words.txt"),
          fetch("/answers.txt"),
        ]);
        const wordsList = (await wordsRes.text())
          .split("\n")
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length === 5);
        const answersList = (await answersRes.text())
          .split("\n")
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length === 5);
        setWords(new Set(wordsList));
        setAnswers(answersList);
      } catch (err) {
        console.error("Failed to load word lists:", err);
      }
    };
    loadWords();
  }, []);

  // Initialize game when answers are loaded
  useEffect(() => {
    if (answers.length === 0) return;
    const saved = storageGet<GameState | null>(KEYS.gameState, null);
    const today = new Date().toDateString();
    const lastGameDate = storageGet<string>(KEYS.lastGameDate, "");
    const savedStreak = storageGet<Streak>(KEYS.streak, {
      wins: 0,
      losses: 0,
      current: 0,
    });

    // New day, reset game
    if (lastGameDate !== today) {
      const targetWord = getdailyWord(answers);
      setGameState({ targetWord, guesses: [], gameOver: false, won: false });
      setCurrentGuess("");
      storageSet(KEYS.lastGameDate, today);
    } else if (saved) {
      setGameState(saved);
      setCurrentGuess("");
    } else {
      const targetWord = getdailyWord(answers);
      setGameState({ targetWord, guesses: [], gameOver: false, won: false });
      setCurrentGuess("");
    }
    setStreak(savedStreak);
  }, [answers.length]);

  const addLetter = useCallback(
    (letter: string) => {
      if (gameState.gameOver || currentGuess.length >= 5) return;
      setCurrentGuess((prev) => prev + letter);
      setError("");
    },
    [gameState.gameOver, currentGuess.length],
  );

  const removeLetter = useCallback(() => {
    setCurrentGuess((prev) => prev.slice(0, -1));
    setError("");
  }, []);

  const submitGuess = useCallback(() => {
    if (!words.has(currentGuess)) {
      setError(lang === "el" ? "Η λέξη δεν υπάρχει" : "Word not in list");
      return;
    }

    const newGuesses = [...gameState.guesses, currentGuess];
    const won = currentGuess === gameState.targetWord;
    const gameOver = won || newGuesses.length >= MAX_ATTEMPTS;
    const newState: GameState = {
      targetWord: gameState.targetWord,
      guesses: newGuesses,
      gameOver,
      won,
    };

    if (gameOver) {
      const newStreak: Streak = { ...streak };
      if (won) {
        newStreak.wins += 1;
        newStreak.current += 1;
        newState.shareGrid = generateShareGrid(
          newGuesses,
          gameState.targetWord,
          newGuesses.length,
        );
      } else {
        newStreak.losses += 1;
        newStreak.current = 0;
      }
      storageSet(KEYS.streak, newStreak);
      setStreak(newStreak);
    }

    setGameState(newState);
    storageSet(KEYS.gameState, newState);
    setCurrentGuess("");
    setError("");
  }, [currentGuess, gameState, words, streak, lang]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState.gameOver) return;
      const upper = e.key.toUpperCase();
      if (GREEK_LETTERS.includes(upper)) {
        addLetter(upper);
      } else if (e.key === "Backspace") {
        removeLetter();
      } else if (e.key === "Enter") {
        submitGuess();
      }
    },
    [gameState.gameOver, addLetter, removeLetter, submitGuess],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const resetGame = () => {
    if (answers.length === 0) return;
    const targetWord = getdailyWord(answers);
    const newState: GameState = {
      targetWord,
      guesses: [],
      gameOver: false,
      won: false,
    };
    setGameState(newState);
    storageSet(KEYS.gameState, newState);
    setCurrentGuess("");
    setError("");
  };

  const copyShareGrid = async () => {
    if (!gameState.shareGrid) return;

    try {
      // Try native share first if available
      if (navigator.share) {
        await navigator.share({
          title: lang === "el" ? "Wordle Αποτέλεσμα" : "Wordle Result",
          text: gameState.shareGrid,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(gameState.shareGrid);
      }

      setCopyNotif(true);
      setTimeout(() => setCopyNotif(false), 2000);
    } catch (err) {
      console.error("Share failed:", err);
      try {
        await navigator.clipboard.writeText(gameState.shareGrid);
        setCopyNotif(true);
        setTimeout(() => setCopyNotif(false), 2000);
      } catch {
        console.error("Clipboard write failed");
      }
    }
  };

  const evaluateGuess = (guess: string): ("correct" | "present" | "absent")[] => {
    const result: ("correct" | "present" | "absent")[] = Array(5).fill("absent");
    const targetCounts: Record<string, number> = {};

    // Count letters in target
    for (const char of gameState.targetWord) {
      targetCounts[char] = (targetCounts[char] ?? 0) + 1;
    }

    // First pass: mark exact matches
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === gameState.targetWord[i]) {
        result[i] = "correct";
        targetCounts[guess[i]]--;
      }
    }

    // Second pass: mark present or absent
    for (let i = 0; i < guess.length; i++) {
      if (result[i] === "correct") continue;
      if (targetCounts[guess[i]] && targetCounts[guess[i]] > 0) {
        result[i] = "present";
        targetCounts[guess[i]]--;
      } else {
        result[i] = "absent";
      }
    }

    return result;
  };

  const getLetterStatus = (
    letter: string,
    index: number,
  ): "correct" | "present" | "absent" | undefined => {
    for (const guess of gameState.guesses) {
      if (guess[index] === letter) {
        const evaluation = evaluateGuess(guess);
        return evaluation[index];
      }
    }
    return undefined;
  };

  const getKeyboardLetterStatus = (
    letter: string,
  ): "correct" | "present" | "absent" | undefined => {
    let bestStatus: "correct" | "present" | "absent" | undefined;
    for (const guess of gameState.guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === letter) {
          if (letter === gameState.targetWord[i]) {
            return "correct";
          }
          if (gameState.targetWord.includes(letter)) {
            bestStatus = "present";
          } else if (!bestStatus) {
            bestStatus = "absent";
          }
        }
      }
    }
    return bestStatus;
  };

  return (
    <div className="h-full scroll-area">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-1.5 ml-1 mb-4">
          <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500">
            {t("game_title")}
          </h1>
          <span className="relative group inline-flex">
            <button
              type="button"
              aria-label={t("game_info_tooltip")}
              className="w-4 h-4 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Info size={13} />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-6 z-30 w-64 p-3 rounded-xl bg-gray-900 dark:bg-black text-white text-[11px] leading-relaxed shadow-xl opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 normal-case tracking-normal font-normal"
            >
              {t("game_info_tooltip")}
            </span>
          </span>
        </div>

        {/* Streak info */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white dark:bg-[#141929] rounded-xl p-3 text-center border border-gray-100 dark:border-[#1E2D4E]">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
              {lang === "el" ? "Νίκες" : "Wins"}
            </p>
            <p className="text-2xl font-black text-primary">{streak.wins}</p>
          </div>
          <div className="bg-white dark:bg-[#141929] rounded-xl p-3 text-center border border-gray-100 dark:border-[#1E2D4E]">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
              {lang === "el" ? "Σερί" : "Streak"}
            </p>
            <p className="text-2xl font-black text-primary">{streak.current}</p>
          </div>
          <div className="bg-white dark:bg-[#141929] rounded-xl p-3 text-center border border-gray-100 dark:border-[#1E2D4E]">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
              {lang === "el" ? "Ήττες" : "Losses"}
            </p>
            <p className="text-2xl font-black text-red-500">{streak.losses}</p>
          </div>
        </div>

        {/* Game board */}
        <div className="bg-white dark:bg-[#141929] rounded-2xl p-4 border border-gray-100 dark:border-[#1E2D4E] mb-4">
          {/* Guess rows */}
          <div className="space-y-2 mb-4">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
              const guess = gameState.guesses[i];
              const isCurrent =
                i === gameState.guesses.length && !gameState.gameOver;
              const letters = guess
                ? guess.split("")
                : isCurrent
                  ? currentGuess.split("")
                  : [];
              return (
                <div key={i} className="flex gap-1.5 justify-center">
                  {Array.from({ length: 5 }).map((_, j) => {
                    const letter = letters[j];
                    const status = guess
                      ? getLetterStatus(letter, j)
                      : undefined;
                    const bgColor =
                      status === "correct"
                        ? "bg-green-500"
                        : status === "present"
                          ? "bg-yellow-500"
                          : status === "absent"
                            ? "bg-gray-400"
                            : "bg-gray-100 dark:bg-[#252A3A] border border-gray-300 dark:border-[#3A4660]";
                    const textColor = status
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300";
                    return (
                      <div
                        key={j}
                        className={`w-12 h-12 rounded-lg font-bold text-lg flex items-center justify-center ${bgColor} ${textColor}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Status message */}
          {error && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg animate-bounce">
                {error}
              </div>
            </div>
          )}
          {copyNotif && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg animate-bounce">
                {lang === "el" ? "Αποτέλεσμα αντιγράφηκε" : "Result copied to clipboard"}
              </div>
            </div>
          )}
          {gameState.gameOver && (
            <div
              className={`text-center mb-3 p-2 rounded-lg ${gameState.won ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
            >
              <p
                className={`font-bold ${gameState.won ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
              >
                {gameState.won
                  ? lang === "el"
                    ? "🎉 Συγχαρητήρια!"
                    : "🎉 Congratulations!"
                  : `${lang === "el" ? "Η λέξη ήταν" : "The word was"}: ${gameState.targetWord}`}
              </p>
            </div>
          )}
        </div>

        {/* Keyboard — keys spaced out with larger tap targets to avoid mis-taps */}
        <div className="space-y-2.5 mb-4">
          {["ΕΡΤΥΘΙΟΠ", "ΑΣΔΦΓΗΞΚΛ", "ΖΧΨΩΒΝΜ"].map((row, i) => (
            <div key={i} className="flex gap-2 justify-center">
              {row.split("").map((letter) => {
                const status = getKeyboardLetterStatus(letter);
                const bgColor =
                  status === "correct"
                    ? "bg-green-500"
                    : status === "present"
                      ? "bg-yellow-500"
                      : status === "absent"
                        ? "bg-gray-400"
                        : "bg-gray-100 dark:bg-[#252A3A]";
                const textColor = status
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300";
                return (
                  <button
                    key={letter}
                    onClick={() => addLetter(letter)}
                    disabled={gameState.gameOver}
                    className={`flex-1 min-w-0 max-w-[2.4rem] py-3 rounded-lg ${bgColor} ${textColor} text-[13px] font-bold hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={removeLetter}
            disabled={gameState.gameOver || currentGuess.length === 0}
            className="flex-1 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← {lang === "el" ? "Διαγραφή" : "Delete"}
          </button>
          <button
            onClick={submitGuess}
            disabled={gameState.gameOver || currentGuess.length < 5}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lang === "el" ? "Υποβολή" : "Submit"}
          </button>
        </div>

        {gameState.gameOver && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary dark:text-primary-300 font-bold text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <RotateCcw size={16} />
              {lang === "el" ? "Νέο Παιχνίδι" : "New Game"}
            </button>
            {gameState.shareGrid && (
              <button
                onClick={copyShareGrid}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors"
              >
                <Share2 size={16} />
                {lang === "el" ? "Κοινοποίηση" : "Share"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function generateShareGrid(
  guesses: string[],
  target: string,
  attempts: number,
): string {
  const lines = guesses.map((guess) =>
    guess
      .split("")
      .map((letter, i) => {
        if (letter === target[i]) return "🟩";
        if (target.includes(letter)) return "🟨";
        return "⬜";
      })
      .join(""),
  );
  return `Wordle ${new Date().getDate()} ${attempts}/6\n\n${lines.join("\n")}`;
}
