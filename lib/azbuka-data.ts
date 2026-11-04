export type DeckId = "familiar" | "lookalikes" | "new" | "difficult" | "signs";

export type LetterCard = {
  id: string;
  upper: string;
  lower: string;
  name: string;
  sound: string;
  guide: string;
  example: string;
  transliteration: string;
  meaning: string;
  tip: string;
  deck: DeckId;
};

export const DECKS: Record<DeckId, { title: string; eyebrow: string; color: string; description: string }> = {
  familiar: {
    title: "Looks familiar",
    eyebrow: "01 / START HERE",
    color: "#9BE9FB",
    description: "Letters that feel friendly right away.",
  },
  lookalikes: {
    title: "Sneaky lookalikes",
    eyebrow: "02 / WATCH CLOSELY",
    color: "#FAE8FF",
    description: "They look like Latin letters, but sound different.",
  },
  new: {
    title: "New characters",
    eyebrow: "03 / BUILD IT UP",
    color: "#F6BED5",
    description: "A fresh set of shapes to add to your map.",
  },
  difficult: {
    title: "Tricky sounds",
    eyebrow: "04 / LISTEN IN",
    color: "#FDE68A",
    description: "The sounds that deserve an extra beat.",
  },
  signs: {
    title: "Special signs",
    eyebrow: "05 / FINAL PIECES",
    color: "#D9F99D",
    description: "Small marks that change how words behave.",
  },
};

export const LETTERS: LetterCard[] = [
  { id: "a", upper: "А", lower: "а", name: "A", sound: "a", guide: "ah, as in father", example: "мама", transliteration: "mama", meaning: "mom", tip: "This one is your anchor: it looks and sounds just like A.", deck: "familiar" },
  { id: "e", upper: "Е", lower: "е", name: "Ye", sound: "ye", guide: "ye, as in yes", example: "еда", transliteration: "yeda", meaning: "food", tip: "At the start of a word, Е often begins with a tiny y-sound.", deck: "familiar" },
  { id: "k", upper: "К", lower: "к", name: "Ka", sound: "k", guide: "k, as in kite", example: "кот", transliteration: "kot", meaning: "cat", tip: "A familiar shape and a familiar sound — an easy win.", deck: "familiar" },
  { id: "m", upper: "М", lower: "м", name: "Em", sound: "m", guide: "m, as in moon", example: "мир", transliteration: "mir", meaning: "world / peace", tip: "М looks exactly like M. Let it be your confidence letter.", deck: "familiar" },
  { id: "o", upper: "О", lower: "о", name: "O", sound: "o", guide: "o, as in more", example: "окно", transliteration: "okno", meaning: "window", tip: "Round and reliable: О is one of the best first letters.", deck: "familiar" },
  { id: "t", upper: "Т", lower: "т", name: "Te", sound: "t", guide: "t, as in tea", example: "такси", transliteration: "taksi", meaning: "taxi", tip: "Printed lowercase т can look like a little m — keep its T sound.", deck: "familiar" },
  { id: "v", upper: "В", lower: "в", name: "Ve", sound: "v", guide: "v, as in violin", example: "вино", transliteration: "vino", meaning: "wine", tip: "В looks like B, but it says V.", deck: "lookalikes" },
  { id: "n", upper: "Н", lower: "н", name: "En", sound: "n", guide: "n, as in nose", example: "нос", transliteration: "nos", meaning: "nose", tip: "Н looks like H, but it says N.", deck: "lookalikes" },
  { id: "r", upper: "Р", lower: "р", name: "Er", sound: "r", guide: "rolled r", example: "рыба", transliteration: "ryba", meaning: "fish", tip: "Р looks like P, but it is a lightly rolled R.", deck: "lookalikes" },
  { id: "s", upper: "С", lower: "с", name: "Es", sound: "s", guide: "s, as in sun", example: "суп", transliteration: "sup", meaning: "soup", tip: "С looks like C, but it says S.", deck: "lookalikes" },
  { id: "u", upper: "У", lower: "у", name: "U", sound: "oo", guide: "oo, as in boot", example: "утка", transliteration: "utka", meaning: "duck", tip: "У looks like Y, but it says oo.", deck: "lookalikes" },
  { id: "kh", upper: "Х", lower: "х", name: "Kha", sound: "kh", guide: "kh, like loch", example: "хлеб", transliteration: "khleb", meaning: "bread", tip: "Х looks like X and breathes out a rough h.", deck: "lookalikes" },
  { id: "b", upper: "Б", lower: "б", name: "Be", sound: "b", guide: "b, as in bed", example: "банк", transliteration: "bank", meaning: "bank", tip: "Б is a new shape with a very familiar B sound.", deck: "new" },
  { id: "g", upper: "Г", lower: "г", name: "Ge", sound: "g", guide: "g, as in go", example: "гора", transliteration: "gora", meaning: "mountain", tip: "Г is angular and says a hard G.", deck: "new" },
  { id: "d", upper: "Д", lower: "д", name: "De", sound: "d", guide: "d, as in dog", example: "дом", transliteration: "dom", meaning: "house", tip: "Printed Д has a little roof; lowercase д can look like a handwritten g.", deck: "new" },
  { id: "z", upper: "З", lower: "з", name: "Ze", sound: "z", guide: "z, as in zebra", example: "зима", transliteration: "zima", meaning: "winter", tip: "З is a 3-shaped Z sound.", deck: "new" },
  { id: "i", upper: "И", lower: "и", name: "I", sound: "ee", guide: "ee, as in see", example: "игра", transliteration: "igra", meaning: "game", tip: "И looks like N in a mirror, but says ee.", deck: "new" },
  { id: "l", upper: "Л", lower: "л", name: "El", sound: "l", guide: "l, as in lamp", example: "лампа", transliteration: "lampa", meaning: "lamp", tip: "Л is a pointed A-like shape with an L sound.", deck: "new" },
  { id: "p", upper: "П", lower: "п", name: "Pe", sound: "p", guide: "p, as in pen", example: "папа", transliteration: "papa", meaning: "dad", tip: "П looks like a doorway and says P.", deck: "new" },
  { id: "f", upper: "Ф", lower: "ф", name: "Ef", sound: "f", guide: "f, as in fun", example: "фото", transliteration: "foto", meaning: "photo", tip: "Ф is a circle with a crossbar — a bold F sound.", deck: "new" },
  { id: "ts", upper: "Ц", lower: "ц", name: "Tse", sound: "ts", guide: "ts, as in cats", example: "цирк", transliteration: "tsirk", meaning: "circus", tip: "Say T and S together quickly.", deck: "new" },
  { id: "ch", upper: "Ч", lower: "ч", name: "Che", sound: "ch", guide: "ch, as in chair", example: "чай", transliteration: "chai", meaning: "tea", tip: "Ч is a soft, clean ch sound.", deck: "new" },
  { id: "sh", upper: "Ш", lower: "ш", name: "Sha", sound: "sh", guide: "sh, as in ship", example: "школа", transliteration: "shkola", meaning: "school", tip: "Ш is the broad sh sound — let your lips round slightly.", deck: "new" },
  { id: "zh", upper: "Ж", lower: "ж", name: "Zhe", sound: "zh", guide: "zh, as in measure", example: "журнал", transliteration: "zhurnal", meaning: "magazine", tip: "Ж is a buzzing zh, like the middle of measure.", deck: "difficult" },
  { id: "yo", upper: "Ё", lower: "ё", name: "Yo", sound: "yo", guide: "yo, as in yonder", example: "ёлка", transliteration: "yolka", meaning: "fir tree", tip: "The two dots are your clue: Ё starts with a y-glide.", deck: "difficult" },
  { id: "y", upper: "Й", lower: "й", name: "Short I", sound: "y", guide: "short y, as in boy", example: "йогурт", transliteration: "yogurt", meaning: "yogurt", tip: "Й is И with a little roof — a quick glide, not a full vowel.", deck: "difficult" },
  { id: "shch", upper: "Щ", lower: "щ", name: "Shcha", sound: "shch", guide: "soft sh-ch blend", example: "щука", transliteration: "shchuka", meaning: "pike", tip: "Think of a long, soft sh that leans toward ch.", deck: "difficult" },
  { id: "yery", upper: "Ы", lower: "ы", name: "Yery", sound: "ih", guide: "deep i, no English twin", example: "мы", transliteration: "my", meaning: "we", tip: "Start with ee, pull the tongue back, and keep the jaw relaxed.", deck: "difficult" },
  { id: "e-open", upper: "Э", lower: "э", name: "E", sound: "eh", guide: "e, as in echo", example: "это", transliteration: "eto", meaning: "this", tip: "Э is a plain eh — no y-glide at the front.", deck: "difficult" },
  { id: "yu", upper: "Ю", lower: "ю", name: "Yu", sound: "yu", guide: "you, as in use", example: "юла", transliteration: "yula", meaning: "spinning top", tip: "Ю begins with a y-glide followed by oo.", deck: "difficult" },
  { id: "ya", upper: "Я", lower: "я", name: "Ya", sound: "ya", guide: "ya, as in yacht", example: "яблоко", transliteration: "yabloko", meaning: "apple", tip: "Я is the friendly ya sound — a great final vowel.", deck: "difficult" },
  { id: "hard-sign", upper: "Ъ", lower: "ъ", name: "Hard sign", sound: "—", guide: "no sound of its own", example: "подъезд", transliteration: "pod'yezd", meaning: "building entrance", tip: "Ъ separates a consonant from a following y-glide.", deck: "signs" },
  { id: "soft-sign", upper: "Ь", lower: "ь", name: "Soft sign", sound: "—", guide: "no sound of its own", example: "день", transliteration: "den'", meaning: "day", tip: "Ь softens the consonant before it; it never speaks alone.", deck: "signs" },
];

export const LEARN_ORDER = [
  "a", "e", "k", "m", "o", "t",
  "v", "n", "r", "s", "u", "kh",
  "b", "g", "d", "z", "i", "l", "p", "f", "ts", "ch", "sh",
  "zh", "yo", "y", "shch", "yery", "e-open", "yu", "ya",
  "hard-sign", "soft-sign",
];

export const READING_EXERCISES = [
  { word: "мама", transliteration: "mama", meaning: "mom", letters: ["m", "a"] },
  { word: "кот", transliteration: "kot", meaning: "cat", letters: ["k", "o", "t"] },
  { word: "дом", transliteration: "dom", meaning: "house", letters: ["d", "o", "m"] },
  { word: "суп", transliteration: "sup", meaning: "soup", letters: ["s", "u", "p"] },
  { word: "такси", transliteration: "taksi", meaning: "taxi", letters: ["t", "a", "k", "s", "i"] },
  { word: "чай", transliteration: "chai", meaning: "tea", letters: ["ch", "a", "y"] },
  { word: "школа", transliteration: "shkola", meaning: "school", letters: ["sh", "k", "o", "l", "a"] },
  { word: "яблоко", transliteration: "yabloko", meaning: "apple", letters: ["ya", "b", "l", "o", "k", "o"] },
];

export const LETTER_BY_ID = Object.fromEntries(LETTERS.map((letter) => [letter.id, letter])) as Record<string, LetterCard>;
