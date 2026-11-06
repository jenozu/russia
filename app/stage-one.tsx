import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AudioButton, COLORS, IconButton, PrimaryButton, SecondaryButton, SectionLabel, shadow } from "@/components/azbuka-ui";
import { STAGE_ONE_CONVERSATION, STAGE_ONE_DAYS, STAGE_ONE_ITEMS, STAGE_ONE_PATTERNS, STAGE_ONE_READY_CHECKLIST, STAGE_ONE_REVIEW_SAMPLE } from "@/lib/stage-one-data";

export default function StageOneScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [showPatterns, setShowPatterns] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const dayMeta = STAGE_ONE_DAYS[selectedDay - 1];
  const dayItems = useMemo(() => selectedDay <= 5 ? STAGE_ONE_ITEMS.filter((item) => item.day === selectedDay) : STAGE_ONE_REVIEW_SAMPLE, [selectedDay]);
  const current = dayItems[index % dayItems.length];
  const completedForDay = dayItems.filter((item) => reviewed.has(item.id)).length;
  const stageProgress = Math.round((reviewed.size / STAGE_ONE_ITEMS.length) * 100);

  const changeDay = (day: number) => {
    setSelectedDay(day);
    setIndex(0);
    setRevealed(false);
  };

  const markAndAdvance = () => {
    setReviewed((previous) => new Set(previous).add(current.id));
    setRevealed(false);
    setIndex((value) => (value + 1) % dayItems.length);
  };

  return (
    <ScreenContainer style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <IconButton icon="close" label="Close Stage 1" onPress={() => router.back()} />
          <View style={styles.topMeta}><Text style={styles.kicker}>AZBUKA / STAGE 1</Text><Text style={styles.topTitle}>Speak first.</Text></View>
          <View style={styles.stageBadge}><Text style={styles.stageBadgeNumber}>{stageProgress}%</Text><Text style={styles.stageBadgeLabel}>mapped</Text></View>
        </View>

        <View style={[styles.heroCard, shadow(5)]}>
          <Text style={styles.heroEyebrow}>100 EVERYDAY WORDS & EXPRESSIONS</Text>
          <Text style={styles.heroTitle}>Get communicating quickly — without needing Cyrillic first.</Text>
          <Text style={styles.heroBody}>Meaning → pronunciation → say it aloud → recognize the Cyrillic → use a tiny sentence.</Text>
          <View style={styles.sequenceRow}>{["Meaning", "Sound", "Say", "See", "Use"].map((step, stepIndex) => <View key={step} style={styles.sequenceStep}><Text style={styles.sequenceNumber}>{stepIndex + 1}</Text><Text style={styles.sequenceText}>{step}</Text></View>)}</View>
        </View>

        <View style={styles.sectionHeader}><SectionLabel>Seven-day runway</SectionLabel><Text style={styles.sectionHint}>{reviewed.size}/100 reviewed</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRail}>
          {STAGE_ONE_DAYS.map((day) => <Pressable key={day.day} onPress={() => changeDay(day.day)} style={({ pressed }) => [styles.dayChip, selectedDay === day.day && styles.dayChipActive, pressed && styles.pressed]}><Text style={[styles.dayNumber, selectedDay === day.day && styles.dayTextActive]}>DAY {day.day}</Text><Text style={[styles.dayTitle, selectedDay === day.day && styles.dayTextActive]}>{day.title}</Text><Text style={[styles.daySummary, selectedDay === day.day && styles.dayTextActive]}>{day.summary}</Text></Pressable>)}
        </ScrollView>

        <View style={styles.lessonHeader}><View><Text style={styles.lessonEyebrow}>DAY {selectedDay} / {dayMeta.title.toUpperCase()}</Text><Text style={styles.lessonTitle}>{dayMeta.summary}</Text></View><Text style={styles.lessonCount}>{completedForDay}/{dayItems.length}</Text></View>
        <View style={[styles.itemCard, shadow(5)]}>
          <Text style={styles.itemLabel}>{current.section.toUpperCase()} · ITEM {current.number}</Text>
          {!revealed ? <View style={styles.itemFront}><Text style={styles.itemEnglish}>{current.english}</Text><Text style={styles.itemHint}>Tap reveal, then say the Russian aloud.</Text><SecondaryButton onPress={() => setRevealed(true)}><Text style={styles.secondaryText}>Reveal Russian</Text><MaterialIcons name="visibility" size={18} color={COLORS.black} /></SecondaryButton></View> : <View style={styles.itemBack}><View style={styles.russianRow}><View><Text style={styles.itemRussian}>{current.russian}</Text><Text style={styles.itemPronunciation}>{current.pronunciation}</Text></View><AudioButton text={current.russian} label={`Hear ${current.russian}`} /></View><Text style={styles.itemEnglishBack}>{current.english}</Text><View style={styles.sayBanner}><MaterialIcons name="record-voice-over" size={20} color={COLORS.black} /><Text style={styles.sayText}>Say it aloud once. Recognition comes after the sound.</Text></View><PrimaryButton onPress={markAndAdvance}><Text style={styles.buttonText}>I can say it</Text><MaterialIcons name="arrow-forward" size={19} color={COLORS.black} /></PrimaryButton><Pressable onPress={markAndAdvance} style={({ pressed }) => [styles.reviewLink, pressed && styles.pressed]}><Text style={styles.reviewLinkText}>Review again later</Text></Pressable></View>}
        </View>

        <View style={styles.supportCard}><Text style={styles.supportEyebrow}>TINY SENTENCE LAB</Text><Text style={styles.supportTitle}>Turn the words into a small conversation.</Text><Text style={styles.supportBody}>Stage 1 is about recognition first, then useful combinations you can say before grammar feels comfortable.</Text><Pressable onPress={() => setShowPatterns((value) => !value)} style={styles.supportToggle}><Text style={styles.supportToggleText}>{showPatterns ? "Hide sentence patterns" : "Open sentence patterns"}</Text><MaterialIcons name={showPatterns ? "expand-less" : "expand-more"} size={20} color={COLORS.black} /></Pressable>{showPatterns && <View style={styles.patternList}>{STAGE_ONE_PATTERNS.map(([russian, pronunciation, english]) => <View key={russian} style={styles.patternRow}><Text style={styles.patternRussian}>{russian}</Text><Text style={styles.patternPronunciation}>{pronunciation}</Text><Text style={styles.patternEnglish}>{english}</Text></View>)}</View>}<Pressable onPress={() => setShowConversation((value) => !value)} style={styles.supportToggle}><Text style={styles.supportToggleText}>{showConversation ? "Hide mini conversation" : "Open mini conversation"}</Text><MaterialIcons name={showConversation ? "expand-less" : "expand-more"} size={20} color={COLORS.black} /></Pressable>{showConversation && <View style={styles.conversationList}>{STAGE_ONE_CONVERSATION.map(([russian, pronunciation, english]) => <View key={russian} style={styles.conversationRow}><Text style={styles.conversationRussian}>{russian}</Text><Text style={styles.conversationPronunciation}>{pronunciation}</Text><Text style={styles.conversationEnglish}>{english}</Text></View>)}</View>}</View>

        <View style={styles.readyCard}><Text style={styles.supportEyebrow}>READY FOR STAGE 2?</Text><Text style={styles.supportTitle}>Move on when these feel comfortable.</Text>{STAGE_ONE_READY_CHECKLIST.map((item) => <View key={item} style={styles.checkRow}><MaterialIcons name="check-box-outline-blank" size={19} color={COLORS.black} /><Text style={styles.checkText}>{item}</Text></View>)}</View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.pink },
  content: { padding: 20, paddingBottom: 40, gap: 18, maxWidth: 620, width: "100%", alignSelf: "center" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topMeta: { alignItems: "center" },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1, color: COLORS.inkMuted },
  topTitle: { fontSize: 18, fontWeight: "900", color: COLORS.black, marginTop: 3 },
  stageBadge: { minWidth: 58, borderRadius: 14, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.cyan, paddingVertical: 7, alignItems: "center" },
  stageBadgeNumber: { fontSize: 17, fontWeight: "900", color: COLORS.black },
  stageBadgeLabel: { fontSize: 9, fontWeight: "800", color: COLORS.black },
  heroCard: { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 2, borderColor: COLORS.black, padding: 18, gap: 12 },
  heroEyebrow: { fontSize: 10, letterSpacing: 1.1, fontWeight: "900", color: COLORS.inkMuted },
  heroTitle: { fontSize: 29, lineHeight: 32, fontWeight: "900", color: COLORS.black },
  heroBody: { fontSize: 14, lineHeight: 19, fontWeight: "600", color: COLORS.inkMuted },
  sequenceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sequenceStep: { alignItems: "center", gap: 5 },
  sequenceNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.cyan, borderWidth: 2, borderColor: COLORS.black, textAlign: "center", lineHeight: 20, fontSize: 11, fontWeight: "900" },
  sequenceText: { fontSize: 10, fontWeight: "800", color: COLORS.black },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionHint: { fontSize: 11, fontWeight: "800", color: COLORS.inkMuted },
  dayRail: { paddingRight: 10 },
  dayChip: { width: 160, minHeight: 94, marginRight: 10, borderRadius: 18, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.white, padding: 12, justifyContent: "space-between" },
  dayChipActive: { backgroundColor: COLORS.black },
  dayNumber: { fontSize: 9, letterSpacing: 1, fontWeight: "900", color: COLORS.inkMuted },
  dayTitle: { fontSize: 17, fontWeight: "900", color: COLORS.black },
  daySummary: { fontSize: 10, lineHeight: 13, fontWeight: "700", color: COLORS.inkMuted },
  dayTextActive: { color: COLORS.white },
  lessonHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  lessonEyebrow: { fontSize: 10, letterSpacing: 1, fontWeight: "900", color: COLORS.inkMuted },
  lessonTitle: { fontSize: 18, lineHeight: 22, fontWeight: "900", color: COLORS.black, maxWidth: 280, marginTop: 4 },
  lessonCount: { fontSize: 15, fontWeight: "900", color: COLORS.black },
  itemCard: { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 2, borderColor: COLORS.black, padding: 20, minHeight: 300 },
  itemLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: COLORS.inkMuted },
  itemFront: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center", gap: 18 },
  itemEnglish: { fontSize: 32, lineHeight: 36, fontWeight: "900", textAlign: "center", color: COLORS.black },
  itemHint: { fontSize: 13, fontWeight: "700", color: COLORS.inkMuted, textAlign: "center" },
  secondaryText: { fontSize: 14, fontWeight: "900", color: COLORS.black },
  itemBack: { gap: 14, paddingTop: 18 },
  russianRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  itemRussian: { fontSize: 36, lineHeight: 40, fontWeight: "900", color: COLORS.black },
  itemPronunciation: { fontSize: 16, fontWeight: "800", color: COLORS.inkMuted, marginTop: 5 },
  itemEnglishBack: { fontSize: 15, fontWeight: "800", color: COLORS.inkMuted },
  sayBanner: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: COLORS.lilac, borderWidth: 2, borderColor: COLORS.black, borderRadius: 14, padding: 11 },
  sayText: { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: "800", color: COLORS.black },
  buttonText: { fontSize: 15, fontWeight: "900", color: COLORS.black },
  reviewLink: { alignItems: "center", paddingVertical: 4 },
  reviewLinkText: { fontSize: 12, fontWeight: "900", color: COLORS.inkMuted, textDecorationLine: "underline" },
  supportCard: { backgroundColor: COLORS.lilac, borderRadius: 22, borderWidth: 2, borderColor: COLORS.black, padding: 16, gap: 10 },
  supportEyebrow: { fontSize: 10, letterSpacing: 1.1, fontWeight: "900", color: COLORS.inkMuted },
  supportTitle: { fontSize: 21, lineHeight: 24, fontWeight: "900", color: COLORS.black },
  supportBody: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: COLORS.inkMuted },
  supportToggle: { minHeight: 42, borderRadius: 13, borderWidth: 2, borderColor: COLORS.black, backgroundColor: COLORS.white, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  supportToggleText: { fontSize: 12, fontWeight: "900", color: COLORS.black },
  patternList: { gap: 8 },
  patternRow: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 2, borderColor: COLORS.black, padding: 10 },
  patternRussian: { fontSize: 17, fontWeight: "900", color: COLORS.black },
  patternPronunciation: { fontSize: 11, fontWeight: "800", color: COLORS.inkMuted, marginTop: 3 },
  patternEnglish: { fontSize: 12, fontWeight: "700", color: COLORS.inkMuted, marginTop: 3 },
  conversationList: { gap: 8 },
  conversationRow: { paddingLeft: 4 },
  conversationRussian: { fontSize: 16, fontWeight: "900", color: COLORS.black },
  conversationPronunciation: { fontSize: 11, fontWeight: "800", color: COLORS.inkMuted, marginTop: 2 },
  conversationEnglish: { fontSize: 12, fontWeight: "700", color: COLORS.inkMuted, marginTop: 2 },
  readyCard: { backgroundColor: COLORS.white, borderRadius: 22, borderWidth: 2, borderColor: COLORS.black, padding: 16, gap: 11 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  checkText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "700", color: COLORS.inkMuted },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
});
