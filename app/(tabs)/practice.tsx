import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AudioButton, COLORS, IconButton, PrimaryButton, SecondaryButton, shadow } from "@/components/azbuka-ui";
import { LETTERS, LETTER_BY_ID, READING_EXERCISES, type LetterCard } from "@/lib/azbuka-data";
import { pickSessionLetters, useLearning, type ReviewRating } from "@/lib/azbuka-store";

type PracticeMode = "flashcards" | "quiz" | "sounds" | "read";

const modeLabels: { key: PracticeMode; label: string }[] = [
  { key: "flashcards", label: "Cards" },
  { key: "quiz", label: "Quiz" },
  { key: "sounds", label: "Sounds" },
  { key: "read", label: "Read" },
];

function ChoiceButton({ letter, selected, correct, answered, disabled, onPress }: { letter: LetterCard; selected: boolean; correct: boolean; answered: boolean; disabled?: boolean; onPress: () => void }) {
  const backgroundColor = answered && correct ? "#D1FAE5" : answered && selected ? "#FEE2E2" : COLORS.white;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.choice, { backgroundColor }, pressed && styles.pressed]}>
      <Text style={styles.choiceUpper}>{letter.upper}</Text>
      <Text style={styles.choiceLower}>{letter.lower}</Text>
    </Pressable>
  );
}

export default function PracticeScreen() {
  const router = useRouter();
  const { state, ready, unlockedLetters, recordReview } = useLearning();
  const [mode, setMode] = useState<PracticeMode>("flashcards");
  const [sessionIds, setSessionIds] = useState<string[]>(() => pickSessionLetters(state, 6).map((letter) => letter.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [readRevealed, setReadRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);


  const currentLetter = LETTER_BY_ID[sessionIds[index]] ?? unlockedLetters[0] ?? LETTERS[0];
  const currentIndex = Math.min(index, Math.max(sessionIds.length - 1, 0));
  const unlockedIdSet = useMemo(() => new Set(unlockedLetters.map((letter) => letter.id)), [unlockedLetters]);
  const availableExercises = useMemo(() => READING_EXERCISES.filter((exercise) => exercise.letters.every((id) => unlockedIdSet.has(id))), [unlockedIdSet]);
  const currentExercise = (availableExercises.length ? availableExercises : READING_EXERCISES)[currentIndex % (availableExercises.length || READING_EXERCISES.length)];
  const choices = useMemo(() => {
    const pool = [currentLetter, ...unlockedLetters.filter((letter) => letter.id !== currentLetter.id)];
    const seed = currentLetter.id.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const offset = pool.length ? seed % pool.length : 0;
    const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
    const next = rotated.slice(0, 4);
    if (!next.some((letter) => letter.id === currentLetter.id)) next[next.length - 1] = currentLetter;
    return next;
  }, [currentLetter, unlockedLetters]);

  const resetSession = (nextMode = mode) => {
    setMode(nextMode);
    setSessionIds(pickSessionLetters(state, 6).map((letter) => letter.id));
    setIndex(0);
    setFlipped(false);
    setAnswered(false);
    setLastCorrect(null);
    setSelectedChoice(null);
    setReadRevealed(false);
    setCompleted(false);
  };

  const advance = () => {
    if (index >= sessionIds.length - 1) {
      setCompleted(true);
      return;
    }
    setIndex((value) => value + 1);
    setFlipped(false);
    setAnswered(false);
    setLastCorrect(null);
    setSelectedChoice(null);
    setReadRevealed(false);
  };

  const review = (rating: ReviewRating) => {
    recordReview(currentLetter.id, rating);
    advance();
  };

  const answerChoice = (letterId: string) => {
    if (answered) return;
    const correct = letterId === currentLetter.id;
    setAnswered(true);
    setSelectedChoice(letterId);
    setLastCorrect(correct);
    recordReview(currentLetter.id, correct ? "got-it" : "again");
  };

  if (!ready || !sessionIds.length) {
    return <ScreenContainer style={styles.screen}><View style={styles.loading}><Text style={styles.loadingText}>Preparing a tiny session…</Text></View></ScreenContainer>;
  }

  if (completed) {
    return (
      <ScreenContainer style={styles.screen}>
        <View style={styles.completeWrap}>
          <View style={[styles.completeCard, shadow(5)]}>
            <Text style={styles.completeKicker}>SESSION COMPLETE</Text>
            <Text style={styles.completeTitle}>A little more Russian is in your head now.</Text>
            <Text style={styles.completeBody}>Your next review will bring the trickiest letters back sooner and let the calm wins breathe.</Text>
            <View style={styles.completeGlyphRow}><Text style={styles.completeGlyph}>А</Text><Text style={styles.completeGlyph}>Б</Text><Text style={styles.completeGlyph}>Я</Text></View>
            <PrimaryButton onPress={() => resetSession(mode)}><Text style={styles.buttonText}>Do one more loop</Text><MaterialIcons name="replay" size={19} color={COLORS.black} /></PrimaryButton>
            <SecondaryButton onPress={() => router.replace("/(tabs)")}><Text style={styles.secondaryText}>Back to today</Text></SecondaryButton>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <IconButton icon="close" label="Close practice" onPress={() => router.back()} />
          <View style={styles.sessionMeta}><Text style={styles.sessionLabel}>PRACTICE / {mode === "read" ? "READ" : mode.toUpperCase()}</Text><Text style={styles.sessionCount}>{currentIndex + 1} of {sessionIds.length}</Text></View>
          <View style={styles.spacer} />
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((currentIndex + 1) / sessionIds.length) * 100}%` }]} /></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRail}>
          {modeLabels.map((item) => (
            <Pressable key={item.key} onPress={() => resetSession(item.key)} style={({ pressed }) => [styles.modeChip, mode === item.key && styles.modeChipActive, pressed && styles.pressed]}>
              <Text style={[styles.modeText, mode === item.key && styles.modeTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {mode === "flashcards" && (
          <>
            <Pressable onPress={() => setFlipped((value) => !value)} style={({ pressed }) => [styles.flashCard, shadow(6), pressed && styles.cardPressed]}>
              {!flipped ? (
                <View style={styles.cardFront}>
                  <Text style={styles.cardFaceLabel}>TAP TO FLIP</Text>
                  <Text style={styles.bigUpper}>{currentLetter.upper}</Text>
                  <Text style={styles.bigLower}>{currentLetter.lower}</Text>
                  <Text style={styles.cardHint}>What sound does this make?</Text>
                </View>
              ) : (
                <View style={styles.cardBack}>
                  <View style={styles.backHeader}><Text style={styles.backGlyph}>{currentLetter.upper}{currentLetter.lower}</Text><AudioButton text={currentLetter.upper} /></View>
                  <Text style={styles.backName}>{currentLetter.name}</Text>
                  <Text style={styles.soundLine}>/{currentLetter.sound}/ <Text style={styles.guide}>· {currentLetter.guide}</Text></Text>
                  <View style={styles.exampleBox}><Text style={styles.exampleWord}>{currentLetter.example}</Text><Text style={styles.exampleMeta}>{currentLetter.transliteration} · {currentLetter.meaning}</Text></View>
                  <Text style={styles.tip}>{currentLetter.tip}</Text>
                </View>
              )}
            </Pressable>
            {!flipped ? <Text style={styles.tapHint}>Tap the card when you’re ready for the clue.</Text> : <Text style={styles.tapHint}>How did that one feel?</Text>}
            {flipped && <View style={styles.ratingRow}><RatingButton label="Again" sublabel="bring back soon" color={COLORS.rose} onPress={() => review("again")} /><RatingButton label="Hard" sublabel="keep it close" color="#FDE68A" onPress={() => review("hard")} /><RatingButton label="Got it" sublabel="space it out" color="#D1FAE5" onPress={() => review("got-it")} /></View>}
          </>
        )}

        {(mode === "quiz" || mode === "sounds") && (
          <View style={styles.quizWrap}>
            <View style={[styles.quizCard, shadow(5)]}>
              <Text style={styles.cardFaceLabel}>{mode === "sounds" ? "SOUND MATCH" : "RECOGNIZE IT"}</Text>
              <Text style={styles.quizTitle}>{mode === "sounds" ? `Which letter makes the /${currentLetter.sound}/ sound?` : `Find the letter for “${currentLetter.guide}”.`}</Text>
              {mode === "sounds" && <AudioButton text={currentLetter.upper} label="Hear the Russian sound" />}
              <View style={styles.choiceGrid}>{choices.map((letter) => <ChoiceButton key={letter.id} letter={letter} selected={selectedChoice === letter.id} correct={letter.id === currentLetter.id} answered={answered} disabled={answered} onPress={() => answerChoice(letter.id)} />)}</View>
              {answered && <View style={[styles.feedback, { backgroundColor: lastCorrect ? "#D1FAE5" : "#FEE2E2" }]}><Text style={styles.feedbackTitle}>{lastCorrect ? "That’s it." : `The answer is ${currentLetter.upper}${currentLetter.lower}.`}</Text><Text style={styles.feedbackBody}>{lastCorrect ? "Nice recognition. Keep the sound attached to the shape." : currentLetter.tip}</Text></View>}
            </View>
            {answered && <PrimaryButton onPress={advance}><Text style={styles.buttonText}>{index >= sessionIds.length - 1 ? "Finish session" : "Next letter"}</Text><MaterialIcons name="arrow-forward" size={19} color={COLORS.black} /></PrimaryButton>}
          </View>
        )}

        {mode === "read" && (
          <View style={styles.quizWrap}>
            <View style={[styles.readCard, shadow(5)]}>
              <Text style={styles.cardFaceLabel}>READ A TINY WORD</Text>
              <Text style={styles.readPrompt}>Say the word out loud, one letter at a time.</Text>
              <Text style={styles.readWord}>{readRevealed ? currentExercise.word : currentExercise.word.replace(/./g, "_ ")}</Text>
              {readRevealed ? <View style={styles.exampleBox}><Text style={styles.exampleMeta}>{currentExercise.transliteration} · {currentExercise.meaning}</Text></View> : <Text style={styles.tapHint}>You can reveal the clue after your first try.</Text>}
              <SecondaryButton onPress={() => setReadRevealed(true)}><Text style={styles.secondaryText}>{readRevealed ? "Clue revealed" : "Show transliteration"}</Text></SecondaryButton>
            </View>
            <View style={styles.ratingRow}><RatingButton label="I read it" sublabel="nice and clear" color="#D1FAE5" onPress={() => review("got-it")} /><RatingButton label="Need help" sublabel="bring it back" color={COLORS.rose} onPress={() => review("again")} /></View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function RatingButton({ label, sublabel, color, onPress }: { label: string; sublabel: string; color: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.ratingButton, { backgroundColor: color }, pressed && styles.pressed]}><Text style={styles.ratingLabel}>{label}</Text><Text style={styles.ratingSub}>{sublabel}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.pink },
  content: { padding: 20, paddingBottom: 36, gap: 16, maxWidth: 620, width: "100%", alignSelf: "center" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, fontWeight: "800", color: COLORS.black },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sessionMeta: { alignItems: "center" },
  sessionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: COLORS.inkMuted },
  sessionCount: { fontSize: 14, fontWeight: "900", color: COLORS.black, marginTop: 4 },
  spacer: { width: 42 },
  progressTrack: { height: 8, borderRadius: 99, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.white, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.black, borderRadius: 99 },
  modeRail: { gap: 8, paddingVertical: 2 },
  modeChip: { minHeight: 38, paddingHorizontal: 14, justifyContent: "center", borderRadius: 99, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.white },
  modeChipActive: { backgroundColor: COLORS.black },
  modeText: { fontSize: 12, fontWeight: "900", color: COLORS.black },
  modeTextActive: { color: COLORS.white },
  flashCard: { minHeight: 420, borderRadius: 26, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.white, overflow: "hidden" },
  cardFront: { flex: 1, alignItems: "center", justifyContent: "center", padding: 22, minHeight: 420 },
  cardBack: { flex: 1, padding: 22, minHeight: 420 },
  cardFaceLabel: { fontSize: 10, letterSpacing: 1.3, fontWeight: "900", color: COLORS.inkMuted },
  bigUpper: { fontSize: 156, lineHeight: 170, fontWeight: "900", color: COLORS.black, marginTop: 20 },
  bigLower: { fontSize: 48, lineHeight: 54, color: COLORS.inkMuted, fontWeight: "500", marginTop: -12 },
  cardHint: { fontSize: 13, fontWeight: "800", color: COLORS.inkMuted, marginTop: 24 },
  backHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backGlyph: { fontSize: 52, lineHeight: 58, fontWeight: "900", color: COLORS.black },
  backName: { fontSize: 30, fontWeight: "900", color: COLORS.black, marginTop: 16 },
  soundLine: { fontSize: 22, fontWeight: "900", color: COLORS.black, marginTop: 6 },
  guide: { fontSize: 13, fontWeight: "700", color: COLORS.inkMuted },
  exampleBox: { marginTop: 24, backgroundColor: COLORS.lilac, borderRadius: 18, borderWidth: 2, borderColor: COLORS.black, padding: 14 },
  exampleWord: { fontSize: 30, fontWeight: "900", color: COLORS.black },
  exampleMeta: { fontSize: 13, fontWeight: "700", color: COLORS.inkMuted, marginTop: 5 },
  tip: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: COLORS.inkMuted, marginTop: 18 },
  tapHint: { textAlign: "center", fontSize: 12, fontWeight: "700", color: COLORS.inkMuted },
  cardPressed: { transform: [{ translateX: 2 }, { translateY: 2 }], shadowOffset: { width: 1, height: 1 } },
  ratingRow: { flexDirection: "row", gap: 8 },
  ratingButton: { flex: 1, minHeight: 64, borderRadius: 16, borderWidth: 2, borderColor: COLORS.black, padding: 10, justifyContent: "center" },
  ratingLabel: { fontSize: 14, fontWeight: "900", color: COLORS.black },
  ratingSub: { fontSize: 10, fontWeight: "700", color: COLORS.inkMuted, marginTop: 3 },
  quizWrap: { gap: 14 },
  quizCard: { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 2, borderColor: COLORS.black, padding: 20, gap: 16 },
  quizTitle: { fontSize: 28, lineHeight: 32, fontWeight: "900", color: COLORS.black },
  choiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  choice: { width: "47%", minHeight: 98, borderRadius: 18, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  choiceUpper: { fontSize: 36, lineHeight: 39, fontWeight: "900", color: COLORS.black },
  choiceLower: { fontSize: 13, fontWeight: "800", color: COLORS.inkMuted },
  feedback: { borderRadius: 16, borderWidth: 2, borderColor: COLORS.black, padding: 14 },
  feedbackTitle: { fontSize: 17, fontWeight: "900", color: COLORS.black },
  feedbackBody: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: COLORS.inkMuted, marginTop: 5 },
  readCard: { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 2, borderColor: COLORS.black, padding: 20, gap: 16, minHeight: 300 },
  readPrompt: { fontSize: 15, lineHeight: 20, fontWeight: "700", color: COLORS.inkMuted },
  readWord: { fontSize: 48, letterSpacing: 2, fontWeight: "900", color: COLORS.black, textAlign: "center", marginVertical: 18 },
  buttonText: { fontSize: 15, fontWeight: "900", color: COLORS.black },
  secondaryText: { fontSize: 14, fontWeight: "900", color: COLORS.black },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  completeWrap: { flex: 1, padding: 20, justifyContent: "center", maxWidth: 620, width: "100%", alignSelf: "center" },
  completeCard: { backgroundColor: COLORS.white, borderRadius: 26, borderWidth: 2, borderColor: COLORS.black, padding: 22, gap: 16 },
  completeKicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, color: COLORS.inkMuted },
  completeTitle: { fontSize: 34, lineHeight: 37, fontWeight: "900", color: COLORS.black },
  completeBody: { fontSize: 15, lineHeight: 21, fontWeight: "600", color: COLORS.inkMuted },
  completeGlyphRow: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 10 },
  completeGlyph: { fontSize: 64, lineHeight: 70, fontWeight: "900", color: COLORS.black },
});
