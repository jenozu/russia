import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LETTERS, LEARN_ORDER, type LetterCard } from "@/lib/azbuka-data";

const STORAGE_KEY = "azbuka-learning-state-v1";

export type ReviewRating = "again" | "hard" | "got-it";
export type CardProgress = {
  correct: number;
  incorrect: number;
  repetitions: number;
  mastery: number;
  nextReview: number;
  lastReviewed: number | null;
};
export type LearningState = {
  cards: Record<string, CardProgress>;
  dailyGoal: number;
  dailyCompleted: number;
  streak: number;
  lastPracticeDate: string | null;
};

type StoreValue = {
  state: LearningState;
  ready: boolean;
  unlockedLetters: LetterCard[];
  masteredLetters: LetterCard[];
  dueLetters: LetterCard[];
  overallPercent: number;
  recordReview: (letterId: string, rating: ReviewRating) => void;
  setDailyGoal: (goal: number) => void;
};

const initialState: LearningState = {
  cards: Object.fromEntries(
    LETTERS.map((letter) => [
      letter.id,
      { correct: 0, incorrect: 0, repetitions: 0, mastery: 0, nextReview: 0, lastReviewed: null },
    ]),
  ),
  dailyGoal: 10,
  dailyCompleted: 0,
  streak: 0,
  lastPracticeDate: null,
};

const todayKey = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const cardIsMastered = (card: CardProgress) => card.mastery >= 3;

export const getUnlockedCount = (state: LearningState) => {
  const masteredCount = Object.values(state.cards).filter(cardIsMastered).length;
  return Math.min(6 + Math.floor(masteredCount / 2) * 4, LEARN_ORDER.length);
};

export const getUnlockedLetters = (state: LearningState) => {
  const unlocked = new Set(LEARN_ORDER.slice(0, getUnlockedCount(state)));
  return LETTERS.filter((letter) => unlocked.has(letter.id));
};

export const getDueLetters = (state: LearningState, limit = 6) => {
  const now = Date.now();
  return getUnlockedLetters(state)
    .filter((letter) => state.cards[letter.id].nextReview <= now)
    .sort((a, b) => {
      const aCard = state.cards[a.id];
      const bCard = state.cards[b.id];
      if (aCard.mastery !== bCard.mastery) return aCard.mastery - bCard.mastery;
      return aCard.nextReview - bCard.nextReview;
    })
    .slice(0, limit);
};

export const pickSessionLetters = (state: LearningState, limit = 6) => {
  const due = getDueLetters(state, limit);
  if (due.length >= limit) return due;
  const unlocked = getUnlockedLetters(state);
  const dueIds = new Set(due.map((letter) => letter.id));
  return [...due, ...unlocked.filter((letter) => !dueIds.has(letter.id))].slice(0, limit);
};

const normalizeState = (value: Partial<LearningState>): LearningState => {
  const normalized = {
    ...initialState,
    ...value,
    cards: { ...initialState.cards, ...(value.cards ?? {}) },
  };
  if (normalized.lastPracticeDate !== todayKey()) {
    return {
      ...normalized,
      dailyCompleted: 0,
      streak: normalized.lastPracticeDate === yesterdayKey() ? normalized.streak : 0,
    };
  }
  return normalized;
};

const nextReviewFor = (rating: ReviewRating, repetitions: number) => {
  const now = Date.now();
  if (rating === "again") return now;
  const day = 24 * 60 * 60 * 1000;
  if (rating === "hard") return now + (repetitions <= 1 ? 0.25 : repetitions <= 3 ? 0.75 : 2) * day;
  return now + (repetitions <= 1 ? 0.5 : repetitions === 2 ? 1 : repetitions === 3 ? 3 : repetitions < 6 ? 7 : 21) * day;
};

export function applyReview(state: LearningState, letterId: string, rating: ReviewRating): LearningState {
  const current = state.cards[letterId] ?? initialState.cards[letterId];
  const isCorrect = rating !== "again";
  const repetitions = isCorrect ? current.repetitions + 1 : 0;
  const mastery = Math.max(0, Math.min(5, current.mastery + (rating === "got-it" ? 2 : rating === "hard" ? 1 : -1)));
  const date = todayKey();
  const lastDate = state.lastPracticeDate;
  const nextStreak = lastDate === date ? state.streak : lastDate === yesterdayKey() ? Math.max(1, state.streak + 1) : 1;
  return {
    ...state,
    dailyCompleted: lastDate === date ? state.dailyCompleted + 1 : 1,
    streak: nextStreak,
    lastPracticeDate: date,
    cards: {
      ...state.cards,
      [letterId]: {
        correct: current.correct + (isCorrect ? 1 : 0),
        incorrect: current.incorrect + (isCorrect ? 0 : 1),
        repetitions,
        mastery,
        nextReview: nextReviewFor(rating, repetitions),
        lastReviewed: Date.now(),
      },
    },
  };
}

const StoreContext = createContext<StoreValue | null>(null);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState(normalizeState(JSON.parse(raw)));
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [ready, state]);

  const recordReview = useCallback((letterId: string, rating: ReviewRating) => {
    setState((current) => applyReview(current, letterId, rating));
  }, []);

  const setDailyGoal = useCallback((goal: number) => {
    setState((current) => ({ ...current, dailyGoal: Math.max(5, Math.min(30, goal)) }));
  }, []);

  const unlockedLetters = useMemo(() => getUnlockedLetters(state), [state]);
  const masteredLetters = useMemo(
    () => unlockedLetters.filter((letter) => cardIsMastered(state.cards[letter.id])),
    [state.cards, unlockedLetters],
  );
  const dueLetters = useMemo(() => getDueLetters(state), [state]);
  const overallPercent = Math.round((Object.values(state.cards).filter(cardIsMastered).length / LETTERS.length) * 100);

  const value = useMemo(
    () => ({ state, ready, unlockedLetters, masteredLetters, dueLetters, overallPercent, recordReview, setDailyGoal }),
    [state, ready, unlockedLetters, masteredLetters, dueLetters, overallPercent, recordReview, setDailyGoal],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useLearning() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useLearning must be used inside LearningProvider");
  return context;
}
