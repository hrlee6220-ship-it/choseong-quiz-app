import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key-placeholder";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface QuizSet {
  id: string;
  owner_id?: string | null;
  title: string;
  description: string;
  category: string;
  words: string[];
  is_public: boolean;
  source: "local" | "cloud";
  created_at: string;
  updated_at: string;
}

export const DEFAULT_QUIZ_SETS: QuizSet[] = [
  {
    id: "local-starter-1",
    title: "교과서 필수 속담·관용어 퀴즈 v1",
    description: "국어 시간과 아침 조회 시간에 다 함께 풀기 좋은 속담 초성퀴즈",
    category: "국어·속담",
    words: [
      "가는 말이 고와야 오는 말이 곱다",
      "천 리 길도 한 걸음부터",
      "소 잃고 외양간 고친다",
      "호랑이도 제 말 하면 온다",
      "원숭이도 나무에서 떨어진다",
      "등잔 밑이 어둡다",
      "백지장도 맞들면 낫다",
      "낮말은 새가 듣고 밤말은 쥐가 듣는다",
      "벼는 익을수록 고개를 숙인다",
      "발 없는 말이 천 리 간다",
    ],
    is_public: true,
    source: "local",
    created_at: "2026-10-23T00:00:00.000Z",
    updated_at: "2026-10-23T00:00:00.000Z",
  },
  {
    id: "local-starter-2",
    title: "우리 반 인기 간식·급식 메뉴 v1",
    description: "학급 레크리에이션 및 쉬는 시간 분위기 메이커용 단어 세트",
    category: "레크리에이션",
    words: [
      "떡볶이",
      "허니버터칩",
      "김치볶음밥",
      "초코칩쿠키",
      "양념치킨",
      "마라탕",
      "딸기탕후루",
      "바나나우유",
      "치즈돈가스",
      "고구마피자",
      "붕어빵",
      "회오리감자",
    ],
    is_public: true,
    source: "local",
    created_at: "2026-10-23T00:00:00.000Z",
    updated_at: "2026-10-23T00:00:00.000Z",
  },
  {
    id: "local-starter-3",
    title: "음악·예술 악기 & 용어 퀴즈 v1",
    description: "음악 수업 도입부에 활용하기 좋은 악기 및 음악 용어 초성퀴즈",
    category: "음악·예술",
    words: [
      "피아노",
      "바이올린",
      "클라리넷",
      "가야금",
      "거문고",
      "교향곡",
      "실로폰",
      "탬버린",
      "첼로",
      "해금",
      "오케스트라",
      "메트로놈",
    ],
    is_public: true,
    source: "local",
    created_at: "2026-10-23T00:00:00.000Z",
    updated_at: "2026-10-23T00:00:00.000Z",
  },
  {
    id: "local-starter-4",
    title: "학교생활 공감 문장 퀴즈 v1",
    description: "문장 단위 초성퀴즈! 1차 받침 힌트와 2차 글자 클릭 힌트를 활용해 보세요",
    category: "학급활동",
    words: [
      "오늘 급식 메뉴는 무엇일까요",
      "체육 시간에는 운동장으로 모이세요",
      "친구에게 따뜻한 말 한마디 건네기",
      "숙제는 미리미리 해 두면 마음이 편하다",
      "우리 반 모두 끝까지 포기하지 말자",
      "우산 챙겨서 안전하게 하교하세요",
    ],
    is_public: true,
    source: "local",
    created_at: "2026-10-23T00:00:00.000Z",
    updated_at: "2026-10-23T00:00:00.000Z",
  },
];
