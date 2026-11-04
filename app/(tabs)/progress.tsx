import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { COLORS, LetterMini, PrimaryButton, ProgressBar, SectionLabel, shadow, StatPill } from "@/components/azbuka-ui";
import { DECKS, LETTERS, type DeckId } from "@/lib/azbuka-data";
import { getUnlockedCount, useLearning } from "@/lib/azbuka-store";

const deckIds: DeckId[] = ["familiar", "lookalikes", "new", "difficult", "signs"];

export default function ProgressScreen() {
  const router = useRouter();
  const { state, ready, overallPercent } = useLearning();
  const unlockedCount = getUnlockedCount(state);
  const masteredCount = Object.values(state.cards).filter((card) => card.mastery >= 3).length;
  const learningCount = Object.values(state.cards).filter((card) => card.mastery > 0 && card.mastery < 3).length;

  if (!ready) return <ScreenContainer style={styles.screen}><View style={styles.loading}><Text style={styles.loadingText}>Counting your wins…</Text></View></ScreenContainer>;

  return (
    <ScreenContainer style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}><View><Text style={styles.kicker}>АЗБУКА / PROGRESS</Text><Text style={styles.title}>You’re building{`\n`}the map.</Text></View><View style={styles.pageMark}><MaterialIcons name="insights" size={24} color={COLORS.black} /></View></View>

        <View style={[styles.heroCard, shadow(5)]}>
          <View style={styles.heroTop}><View><Text style={styles.cardEyebrow}>ALPHABET COMPLETE</Text><Text style={styles.percent}>{overallPercent}<Text style={styles.percentSign}>%</Text></Text></View><View style={styles.heroStamp}><Text style={styles.heroStampBig}>{masteredCount}</Text><Text style={styles.heroStampSmall}>mastered</Text></View></View>
          <ProgressBar value={overallPercent} color={COLORS.black} height={14} />
          <Text style={styles.heroNote}>{masteredCount === 0 ? "Start with six friendly shapes. Mastery will grow one clear sound at a time." : `${33 - masteredCount} letters are waiting for a little more attention.`}</Text>
        </View>

        <View style={styles.statRow}><StatPill value={masteredCount} label="mastered" color={COLORS.cyan} /><StatPill value={learningCount} label="in progress" color={COLORS.lilac} /><StatPill value={state.streak} label="day streak" color={COLORS.white} /></View>

        <View style={styles.sectionHeader}><SectionLabel>Deck by deck</SectionLabel><Text style={styles.sectionHint}>{unlockedCount}/33 open</Text></View>
        <View style={styles.deckList}>{deckIds.map((deck) => {
          const deckLetters = LETTERS.filter((letter) => letter.deck === deck);
          const deckMastered = deckLetters.filter((letter) => state.cards[letter.id].mastery >= 3).length;
          const isUnlocked = deckLetters.some((letter) => LETTERS.slice(0, unlockedCount).some((unlocked) => unlocked.id === letter.id));
          return <View key={deck} style={[styles.deckRow, { backgroundColor: isUnlocked ? DECKS[deck].color : COLORS.neutral }]}><View style={styles.deckNameWrap}><Text style={styles.deckEyebrow}>{DECKS[deck].eyebrow}</Text><Text style={styles.deckName}>{DECKS[deck].title}</Text><Text style={styles.deckMeta}>{isUnlocked ? `${deckMastered}/${deckLetters.length} mastered` : "Unlocks as you get comfortable"}</Text></View><View style={styles.deckProgressWrap}><Text style={styles.deckProgress}>{deckMastered}/{deckLetters.length}</Text><ProgressBar value={(deckMastered / deckLetters.length) * 100} color={COLORS.black} height={9} /></View></View>;
        })}</View>

        <View style={styles.sectionHeader}><SectionLabel>Letter map</SectionLabel><Text style={styles.sectionHint}>Tap Practice to review</Text></View>
        <View style={styles.letterGrid}>{LETTERS.map((letter) => { const progress = state.cards[letter.id]; const isLocked = !LETTERS.slice(0, unlockedCount).some((item) => item.id === letter.id); const tone = isLocked ? COLORS.neutral : progress.mastery >= 3 ? "#D1FAE5" : progress.mastery > 0 ? COLORS.lilac : COLORS.white; return <View key={letter.id} style={styles.letterCell}><LetterMini upper={letter.upper} lower={letter.lower} tone={tone} /><Text style={styles.letterStatus}>{isLocked ? "lock" : progress.mastery >= 3 ? "done" : progress.mastery > 0 ? "learn" : "new"}</Text></View>; })}</View>

        <PrimaryButton onPress={() => router.push("/(tabs)/practice")}><Text style={styles.buttonText}>Practice the next review</Text><MaterialIcons name="arrow-forward" size={20} color={COLORS.black} /></PrimaryButton>
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
  pageMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.lilac, borderWidth: 2, borderColor: COLORS.black, alignItems: "center", justifyContent: "center", ...shadow(3) },
  heroCard: { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 2, borderColor: COLORS.black, padding: 18, gap: 16 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.05, color: COLORS.inkMuted },
  percent: { fontSize: 64, lineHeight: 65, fontWeight: "900", color: COLORS.black, marginTop: 4 },
  percentSign: { fontSize: 28, color: COLORS.inkMuted },
  heroStamp: { backgroundColor: COLORS.cyan, borderRadius: 16, borderWidth: 2, borderColor: COLORS.black, paddingHorizontal: 13, paddingVertical: 10, alignItems: "center" },
  heroStampBig: { fontSize: 26, fontWeight: "900", color: COLORS.black },
  heroStampSmall: { fontSize: 10, fontWeight: "800", color: COLORS.black },
  heroNote: { fontSize: 13, lineHeight: 18, fontWeight: "700", color: COLORS.inkMuted },
  statRow: { flexDirection: "row", gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  sectionHint: { fontSize: 11, fontWeight: "800", color: COLORS.inkMuted },
  deckList: { gap: 10 },
  deckRow: { minHeight: 92, borderRadius: 18, borderWidth: 2, borderColor: COLORS.black, padding: 14, flexDirection: "row", alignItems: "center", gap: 14 },
  deckNameWrap: { flex: 1 },
  deckEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1, color: COLORS.black, marginBottom: 3 },
  deckName: { fontSize: 18, fontWeight: "900", color: COLORS.black },
  deckMeta: { fontSize: 11, fontWeight: "700", color: COLORS.inkMuted, marginTop: 4 },
  deckProgressWrap: { width: 76, gap: 5 },
  deckProgress: { fontSize: 13, fontWeight: "900", color: COLORS.black, textAlign: "right" },
  letterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  letterCell: { width: 62, alignItems: "center", gap: 4 },
  letterStatus: { fontSize: 9, fontWeight: "900", color: COLORS.inkMuted, textTransform: "uppercase" },
  buttonText: { fontSize: 15, fontWeight: "900", color: COLORS.black },
});
