export const CHOSEONG_LIST = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

export const JUNGSEONG_LIST = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
] as const;

export const JONGSEONG_LIST = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

export interface DecomposedChar {
  index: number;
  original: string;
  isHangul: boolean;
  isSpace: boolean;
  choseong: string;
  jungseong: string;
  jongseong: string;
  hasBatchim: boolean;
}

export interface WordGroup {
  wordIndex: number;
  chars: DecomposedChar[];
}

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/**
 * 한글 한 글자를 초성, 중성, 종성(받침)으로 정밀 분해합니다.
 */
export function decomposeChar(char: string, index = 0): DecomposedChar {
  if (char === " ") {
    return {
      index,
      original: char,
      isHangul: false,
      isSpace: true,
      choseong: " ",
      jungseong: "",
      jongseong: "",
      hasBatchim: false,
    };
  }

  const code = char.charCodeAt(0);
  if (code >= HANGUL_START && code <= HANGUL_END) {
    const offset = code - HANGUL_START;
    const choseongIndex = Math.floor(offset / (21 * 28));
    const jungseongIndex = Math.floor((offset % (21 * 28)) / 28);
    const jongseongIndex = offset % 28;

    const choseong = CHOSEONG_LIST[choseongIndex] ?? char;
    const jungseong = JUNGSEONG_LIST[jungseongIndex] ?? "";
    const jongseong = JONGSEONG_LIST[jongseongIndex] ?? "";

    return {
      index,
      original: char,
      isHangul: true,
      isSpace: false,
      choseong,
      jungseong,
      jongseong,
      hasBatchim: jongseong !== "",
    };
  }

  return {
    index,
    original: char,
    isHangul: false,
    isSpace: false,
    choseong: char,
    jungseong: "",
    jongseong: "",
    hasBatchim: false,
  };
}

/**
 * 단어나 문장 전체를 글자 단위로 분해합니다.
 */
export function decomposeText(text: string): DecomposedChar[] {
  return Array.from(text.trim()).map((ch, idx) => decomposeChar(ch, idx));
}

/**
 * 교실 대화면에서 어절(띄어쓰기) 단위로 줄바꿈이 자연스럽게 일어나도록
 * 글자 배열을 어절 그룹으로 묶어 반환합니다.
 */
export function groupByWords(text: string): WordGroup[] {
  const chars = decomposeText(text);
  const groups: WordGroup[] = [];
  let currentChars: DecomposedChar[] = [];
  let wordIndex = 0;

  for (const ch of chars) {
    if (ch.isSpace) {
      if (currentChars.length > 0) {
        groups.push({ wordIndex: wordIndex++, chars: currentChars });
        currentChars = [];
      }
    } else {
      currentChars.push(ch);
    }
  }
  if (currentChars.length > 0) {
    groups.push({ wordIndex: wordIndex++, chars: currentChars });
  }
  return groups;
}

/**
 * 멀티라인 텍스트(엔터 구분)에서 유효한 퀴즈 단어/문장 목록을 추출합니다.
 */
export function parseLinesToWords(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 0);
}

/**
 * 배열을 Fisher-Yates 알고리즘으로 무작위 셔플합니다.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
