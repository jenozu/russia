import { MaterialIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { DECKS, type DeckId } from "@/lib/azbuka-data";

export const COLORS = {
  pink: "#FFD8E8",
  black: "#000000",
  white: "#FFFFFF",
  cyan: "#9BE9FB",
  cyanSoft: "#83DFEF",
  lilac: "#FAE8FF",
  ice: "#EBF8FF",
  rose: "#F6BED5",
  inkMuted: "#4B5563",
  success: "#10B981",
  warning: "#F59E0B",
  neutral: "#F1F1F1",
};

export const shadow = (offset = 4): ViewStyle => ({ shadowColor: COLORS.black, shadowOffset: { width: offset, height: offset }, shadowOpacity: 1, shadowRadius: 0, elevation: offset });

export function PrimaryButton({ children, style, ...props }: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.button, styles.primaryButton, shadow(3), pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

export function SecondaryButton({ children, style, ...props }: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.button, styles.secondaryButton, shadow(2), pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, backgroundColor = COLORS.white }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress?: () => void; backgroundColor?: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor }, shadow(2), pressed && styles.pressed]}
    >
      <MaterialIcons name={icon} size={20} color={COLORS.black} />
    </Pressable>
  );
}

export function ProgressBar({ value, color = COLORS.black, height = 10 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function DeckChip({ deck, locked = false, active = false, onPress }: { deck: DeckId; locked?: boolean; active?: boolean; onPress?: () => void }) {
  const meta = DECKS[deck];
  return (
    <Pressable
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [styles.deckChip, { backgroundColor: active ? COLORS.black : meta.color, opacity: locked ? 0.48 : 1 }, pressed && styles.pressed]}
    >
      <Text style={[styles.deckEyebrow, { color: active ? COLORS.white : COLORS.black }]}>{meta.eyebrow}</Text>
      <Text style={[styles.deckTitle, { color: active ? COLORS.white : COLORS.black }]}>{meta.title}</Text>
      <Text style={[styles.deckLock, { color: active ? COLORS.white : COLORS.black }]}>{locked ? "Locked · keep learning" : "Open deck"}</Text>
    </Pressable>
  );
}

export function AudioButton({ text, label = "Play Russian pronunciation" }: { text: string; label?: string }) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => () => {
    if (Platform.OS === "web" && typeof window !== "undefined") window.speechSynthesis?.cancel();
    if (Platform.OS !== "web") Speech.stop();
  }, []);
  const speak = () => {
    if (Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      utterance.rate = 0.72;
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      return;
    }
    Speech.stop();
    Speech.speak(text, { language: "ru-RU", rate: 0.72, pitch: 1 });
  };
  return (
    <Pressable accessibilityLabel={label} onPress={speak} style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}>
      <MaterialIcons name="volume-up" size={18} color={COLORS.black} />
      <Text style={styles.audioText}>Hear it</Text>
    </Pressable>
  );
}

export function StatPill({ value, label, color = COLORS.white }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={[styles.statPill, { backgroundColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function LetterMini({ upper, lower, tone = COLORS.white }: { upper: string; lower: string; tone?: string }) {
  return (
    <View style={[styles.letterMini, { backgroundColor: tone }]}>
      <Text style={styles.letterMiniUpper}>{upper}</Text>
      <Text style={styles.letterMiniLower}>{lower}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  button: { minHeight: 54, paddingHorizontal: 18, borderRadius: 16, borderWidth: 2, borderColor: COLORS.black, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryButton: { backgroundColor: COLORS.cyan },
  secondaryButton: { backgroundColor: COLORS.white },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], shadowOffset: { width: 1, height: 1 } },
  iconButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 2, borderColor: COLORS.black, alignItems: "center", justifyContent: "center" },
  progressTrack: { width: "100%", backgroundColor: COLORS.white, borderRadius: 99, borderWidth: 2, borderColor: COLORS.black, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  deckChip: { width: 175, minHeight: 126, borderRadius: 20, borderWidth: 2, borderColor: COLORS.black, padding: 14, justifyContent: "space-between", marginRight: 12 },
  deckEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  deckTitle: { fontSize: 20, fontWeight: "900", lineHeight: 23 },
  deckLock: { fontSize: 11, fontWeight: "700" },
  audioButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: COLORS.cyan, borderWidth: 2, borderColor: COLORS.black },
  audioText: { fontSize: 13, fontWeight: "800" },
  statPill: { flex: 1, minHeight: 76, borderRadius: 18, borderWidth: 2, borderColor: COLORS.black, padding: 12, justifyContent: "space-between" },
  statValue: { fontSize: 26, fontWeight: "900", color: COLORS.black },
  statLabel: { fontSize: 11, fontWeight: "700", color: COLORS.inkMuted },
  sectionLabel: { fontSize: 12, fontWeight: "900", letterSpacing: 1.1, color: COLORS.black, textTransform: "uppercase" },
  letterMini: { width: 56, height: 56, borderRadius: 16, borderWidth: 2, borderColor: COLORS.black, alignItems: "center", justifyContent: "center" },
  letterMiniUpper: { fontSize: 23, fontWeight: "900", lineHeight: 25, color: COLORS.black },
  letterMiniLower: { fontSize: 11, fontWeight: "700", color: COLORS.inkMuted },
});
