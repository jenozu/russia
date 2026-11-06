import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { COLORS, DeckChip, PrimaryButton, ProgressBar, SectionLabel, SecondaryButton, shadow, StatPill } from "@/components/azbuka-ui";
import { LETTERS, type DeckId } from "@/lib/azbuka-data";
import { useLearning } from "@/lib/azbuka-store";

const deckIds: DeckId[] = ["familiar", "lookalikes", "new", "difficult", "signs"];

export default function HomeScreen() {
  const router = useRouter();
  const { state, ready, unlockedLetters, masteredLetters, overallPercent, setDailyGoal } = useLearning();
  const remaining = Math.max(0, state.dailyGoal - state.dailyCompleted);
  const todayDone = state.dailyCompleted >= state.dailyGoal;
  const unlockedIds = useMemo(() => new Set(unlockedLetters.map((letter) => letter.id)), [unlockedLetters]);
  const unlockedDeckCount = deckIds.filter((deck) => LETTERS.some((letter) => letter.deck === deck && unlockedIds.has(letter.id))).length;

  if (!ready) {
    return (
      <ScreenContainer style={styles.screen}>
        <View style={styles.loading}><Text style={styles.loadingText}>Loading your alphabet…</Text></View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>АЗБУКА / TODAY</Text>
            <Text style={styles.title}>Build your{"\n"}sound map.</Text>
          </View>
          <View style={styles.mark}><Text style={styles.markText}>Я</Text></View>
        </View>

        <View style={[styles.goalCard, shadow(5)]}>
          <View style={styles.goalTopRow}>
            <View>
              <Text style={styles.cardEyebrow}>{todayDone ? "GOAL COMPLETE" : "TODAY’S SMALL WIN"}</Text>
              <Text style={styles.goalTitle}>{todayDone ? "You showed up." : `${remaining} quick reviews left`}</Text>
            </View>
            <View style={styles.streakBadge}>
              <MaterialIcons name="local-fire-department" size={18} color={COLORS.black} />
              <Text style={styles.streakValue}>{state.streak || 0}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>
          <View style={styles.goalSettingRow}>
            <Text style={styles.goalSettingText}>Daily goal · {state.dailyGoal} reviews</Text>
            <View style={styles.goalAdjuster}>
              <Pressable accessibilityLabel="Decrease daily goal" disabled={state.dailyGoal <= 5} onPress={() => setDailyGoal(state.dailyGoal - 1)} style={styles.goalAdjustButton}><Text style={styles.goalAdjustText}>−</Text></Pressable>
              <Pressable accessibilityLabel="Increase daily goal" disabled={state.dailyGoal >= 30} onPress={() => setDailyGoal(state.dailyGoal + 1)} style={styles.goalAdjustButton}><Text style={styles.goalAdjustText}>+</Text></Pressable>
            </View>
          </View>
          <View style={styles.goalProgressRow}>
            <View style={styles.goalBarWrap}><ProgressBar value={(state.dailyCompleted / state.dailyGoal) * 100} color={COLORS.black} height={12} /></View>
            <Text style={styles.goalCount}>{state.dailyCompleted}/{state.dailyGoal}</Text>
          </View>
          <PrimaryButton onPress={() => router.push("/(tabs)/practice")} style={styles.startButton}>
            <Text style={styles.buttonText}>{todayDone ? "Review weak letters" : "Start today’s session"}</Text>
            <MaterialIcons name="arrow-forward" size={20} color={COLORS.black} />
          </PrimaryButton>
        </View>

        <View style={styles.statRow}>
          <StatPill value={`${overallPercent}%`} label="alphabet complete" color={COLORS.white} />
          <StatPill value={masteredLetters.length} label="mastered letters" color={COLORS.lilac} />
          <StatPill value={unlockedDeckCount} label="decks unlocked" color={COLORS.cyan} />
        </View>

        <View style={styles.stageCard}>
          <View style={styles.stageCardCopy}>
            <Text style={styles.cardEyebrow}>STAGE 1 / SPEAK FIRST</Text>
            <Text style={styles.stageCardTitle}>100 useful Russian words before grammar gets heavy.</Text>
            <Text style={styles.stageCardBody}>A 7-day pronunciation-first runway from hello to tiny conversations.</Text>
          </View>
          <SecondaryButton onPress={() => router.push("/stage-one" as never)}><Text style={styles.stageButtonText}>Open Stage 1</Text><MaterialIcons name="arrow-forward" size={18} color={COLORS.black} /></SecondaryButton>
        </View>
        <View style={styles.sectionHeader}>
          <SectionLabel>Learn in small loops</SectionLabel>
          <Text style={styles.sectionHint}>{unlockedLetters.length}/33 letters open</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deckRail}>
          {deckIds.map((deck) => {
            const isUnlocked = LETTERS.some((letter) => letter.deck === deck && unlockedIds.has(letter.id));
            return <DeckChip key={deck} deck={deck} locked={!isUnlocked} onPress={() => isUnlocked && router.push("/(tabs)/practice")} />;
          })}
        </ScrollView>

        <View style={styles.nextCard}>
          <View style={styles.nextCopy}>
            <Text style={styles.cardEyebrow}>UP NEXT</Text>
            <Text style={styles.nextTitle}>{unlockedLetters.length < 33 ? "Keep the first shapes close." : "The full alphabet is open."}</Text>
            <Text style={styles.nextBody}>
              {unlockedLetters.length < 33 ? "Master a couple of letters and Azbuka will gently open the next set." : "Now let spaced repetition decide what deserves your attention."}
            </Text>
          </View>
          <View style={styles.nextGlyphs}>
            {(unlockedLetters.slice(0, 3).length ? unlockedLetters.slice(0, 3) : LETTERS.slice(0, 3)).map((letter) => (
              <Text key={letter.id} style={styles.glyph}>{letter.upper}</Text>
            ))}
          </View>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/progress")} style={({ pressed }) => [styles.progressLink, pressed && styles.pressed]}>
          <Text style={styles.progressLinkText}>See your alphabet progress</Text>
          <MaterialIcons name="arrow-forward" size={18} color={COLORS.black} />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.pink },
  content: { padding: 20, paddingBottom: 36, gap: 18, maxWidth: 620, width: "100%", alignSelf: "center" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, fontWeight: "800", color: COLORS.black },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 8 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1.3, color: COLORS.black, marginBottom: 8 },
  title: { fontSize: 36, lineHeight: 36, fontWeight: "900", letterSpacing: -1.1, color: COLORS.black },
  mark: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.cyan, borderWidth: 2, borderColor: COLORS.black, alignItems: "center", justifyContent: "center", ...shadow(3) },
  markText: { color: COLORS.black, fontSize: 32, fontWeight: "900" },
  goalCard: { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 2, borderColor: COLORS.black, padding: 18, gap: 16 },
  goalTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.05, color: COLORS.inkMuted, marginBottom: 6 },
  goalTitle: { fontSize: 24, lineHeight: 28, fontWeight: "900", color: COLORS.black, maxWidth: 210 },
  streakBadge: { backgroundColor: COLORS.cyan, borderWidth: 2, borderColor: COLORS.black, borderRadius: 16, padding: 10, minWidth: 92, alignItems: "center", justifyContent: "center" },
  streakValue: { fontSize: 22, fontWeight: "900", color: COLORS.black },
  streakLabel: { fontSize: 10, fontWeight: "800", color: COLORS.black },
  goalSettingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalSettingText: { fontSize: 12, fontWeight: "800", color: COLORS.inkMuted },
  goalAdjuster: { flexDirection: "row", gap: 6 },
  goalAdjustButton: { width: 30, height: 30, borderRadius: 10, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.cyan, alignItems: "center", justifyContent: "center" },
  goalAdjustText: { fontSize: 20, lineHeight: 22, fontWeight: "900", color: COLORS.black },
  goalProgressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  goalBarWrap: { flex: 1 },
  goalCount: { fontSize: 12, fontWeight: "900", color: COLORS.black, minWidth: 46, textAlign: "right" },
  startButton: { width: "100%" },
  buttonText: { fontSize: 15, fontWeight: "900", color: COLORS.black },
  statRow: { flexDirection: "row", gap: 10 },
  stageCard: { backgroundColor: COLORS.cyan, borderWidth: 2, borderColor: COLORS.black, borderRadius: 22, padding: 16, gap: 14 },
  stageCardCopy: { gap: 5 },
  stageCardTitle: { fontSize: 22, lineHeight: 25, fontWeight: "900", color: COLORS.black },
  stageCardBody: { fontSize: 13, lineHeight: 18, fontWeight: "700", color: COLORS.inkMuted },
  stageButtonText: { fontSize: 14, fontWeight: "900", color: COLORS.black },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  sectionHint: { fontSize: 11, fontWeight: "800", color: COLORS.inkMuted },
  deckRail: { paddingRight: 12 },
  nextCard: { backgroundColor: COLORS.lilac, borderWidth: 2, borderColor: COLORS.black, borderRadius: 22, padding: 16, flexDirection: "row", minHeight: 154, overflow: "hidden" },
  nextCopy: { flex: 1, paddingRight: 10 },
  nextTitle: { fontSize: 20, lineHeight: 23, fontWeight: "900", color: COLORS.black, marginBottom: 8 },
  nextBody: { fontSize: 13, lineHeight: 18, color: COLORS.inkMuted, fontWeight: "600" },
  nextGlyphs: { width: 92, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }] },
  glyph: { fontSize: 42, lineHeight: 40, color: COLORS.black, fontWeight: "900", marginVertical: -4 },
  progressLink: { minHeight: 44, borderRadius: 14, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.white, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLinkText: { fontSize: 13, fontWeight: "900", color: COLORS.black },
  pressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
});
