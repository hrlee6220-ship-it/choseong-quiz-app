"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import confetti from "canvas-confetti";
import {
  Shuffle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Trophy,
  RotateCcw,
  ListOrdered,
  CheckCircle2,
  HelpCircle,
  MousePointerClick,
  Plus,
  Minus,
} from "lucide-react";
import { groupByWords, decomposeText, shuffleArray } from "@/lib/hangul";
import { soundFX } from "@/lib/sound";
import { QuizSet } from "@/lib/supabase";

interface QuizPlayViewProps {
  activeSet: QuizSet;
  allSets: QuizSet[];
  onSelectSet: (set: QuizSet) => void;
  onOpenAdmin: () => void;
}

interface TeamScore {
  id: number;
  name: string;
  score: number;
}

export default function QuizPlayView({
  activeSet,
  allSets,
  onSelectSet,
  onOpenAdmin,
}: QuizPlayViewProps) {
  // 랜덤 셔플된 문제 목록
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRandomOrder, setIsRandomOrder] = useState(true);

  // 힌트 및 정답 상태
  const [showHint1Batchim, setShowHint1Batchim] = useState(false); // 1차 힌트: 받침 전체 공개
  const [revealedCharIndices, setRevealedCharIndices] = useState<Set<number>>(new Set()); // 2차 힌트: 선택한 글자 하나씩 모음까지 공개
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false); // 전체 정답 공개
  const [hint2GuidePulse, setHint2GuidePulse] = useState(false);

  // 교실 보조 상태
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWordListModal, setShowWordListModal] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [solvedIndices, setSolvedIndices] = useState<Set<number>>(new Set());
  const [teams, setTeams] = useState<TeamScore[]>([
    { id: 1, name: "1모둠", score: 0 },
    { id: 2, name: "2모둠", score: 0 },
    { id: 3, name: "3모둠", score: 0 },
    { id: 4, name: "4모둠", score: 0 },
    { id: 5, name: "5모둠", score: 0 },
    { id: 6, name: "6모둠", score: 0 },
  ]);

  // 세트 변경 시 자동 랜덤 셔플 초기화
  useEffect(() => {
    const words = activeSet.words.length > 0 ? activeSet.words : ["초성퀴즈 단어를 입력해주세요"];
    setShuffledWords(isRandomOrder ? shuffleArray(words) : [...words]);
    setCurrentIndex(0);
    setShowHint1Batchim(false);
    setRevealedCharIndices(new Set());
    setIsAnswerRevealed(false);
    setSolvedIndices(new Set());
  }, [activeSet, isRandomOrder]);

  const currentWord = shuffledWords[currentIndex] || "";
  const wordGroups = useMemo(() => groupByWords(currentWord), [currentWord]);
  const allChars = useMemo(() => decomposeText(currentWord), [currentWord]);
  const hangulCharIndices = useMemo(
    () => allChars.filter((c) => c.isHangul).map((c) => c.index),
    [allChars]
  );

  // 문제 전환 시 힌트 초기화
  const resetQuestionState = useCallback(() => {
    setShowHint1Batchim(false);
    setRevealedCharIndices(new Set());
    setIsAnswerRevealed(false);
    setHint2GuidePulse(false);
  }, []);

  const goToQuestion = useCallback(
    (idx: number) => {
      if (shuffledWords.length === 0) return;
      const target = ((idx % shuffledWords.length) + shuffledWords.length) % shuffledWords.length;
      setCurrentIndex(target);
      resetQuestionState();
      soundFX.playNextItem();
    },
    [shuffledWords.length, resetQuestionState]
  );

  const handleReshuffle = useCallback(() => {
    const words = activeSet.words.length > 0 ? activeSet.words : ["초성퀴즈 단어를 입력해주세요"];
    setShuffledWords(shuffleArray(words));
    setCurrentIndex(0);
    setSolvedIndices(new Set());
    resetQuestionState();
    soundFX.playNextItem();
  }, [activeSet.words, resetQuestionState]);

  // 1차 힌트: 받침 공개 토글
  const handleToggleHint1 = useCallback(() => {
    setShowHint1Batchim((prev) => {
      const next = !prev;
      if (next) soundFX.playHint1();
      return next;
    });
  }, []);

  // 2차 힌트: 선생님이 선택한 글자 하나씩 모음까지 공개/가리기
  const handleToggleCharReveal = useCallback(
    (charIndex: number) => {
      if (isAnswerRevealed) return;
      setRevealedCharIndices((prev) => {
        const next = new Set(prev);
        if (next.has(charIndex)) {
          next.delete(charIndex);
        } else {
          next.add(charIndex);
          soundFX.playHint2();
        }
        return next;
      });
    },
    [isAnswerRevealed]
  );

  // 2차 힌트 보조 버튼: 아직 공개되지 않은 글자 중 랜덤 1글자 열기 + 클릭 안내 강조
  const handleRevealOneRandomChar = useCallback(() => {
    if (isAnswerRevealed) return;
    setHint2GuidePulse(true);
    const unrevealed = hangulCharIndices.filter((idx) => !revealedCharIndices.has(idx));
    if (unrevealed.length === 0) return;
    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    setRevealedCharIndices((prev) => {
      const next = new Set(prev);
      next.add(pick);
      return next;
    });
    soundFX.playHint2();
  }, [hangulCharIndices, isAnswerRevealed, revealedCharIndices]);

  // 정답 공개
  const handleRevealAnswer = useCallback(() => {
    if (!isAnswerRevealed) {
      setIsAnswerRevealed(true);
      setSolvedIndices((prev) => new Set(prev).add(currentIndex));
      soundFX.playAnswerReveal();
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.65 },
      });
    } else {
      setIsAnswerRevealed(false);
    }
  }, [isAnswerRevealed, currentIndex]);

  // 음소거 토글
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.enabled = next;
      return next;
    });
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 키보드 단축키 지원 (입력창에 포커스 없을 때)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToQuestion(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToQuestion(currentIndex - 1);
      } else if (e.key === "1") {
        e.preventDefault();
        handleToggleHint1();
      } else if (e.key === "2") {
        e.preventDefault();
        handleRevealOneRandomChar();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!isAnswerRevealed) {
          handleRevealAnswer();
        } else {
          goToQuestion(currentIndex + 1);
        }
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleReshuffle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    currentIndex,
    goToQuestion,
    handleToggleHint1,
    handleRevealOneRandomChar,
    handleRevealAnswer,
    handleReshuffle,
    isAnswerRevealed,
  ]);

  const updateTeamScore = (teamId: number, delta: number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t))
    );
    if (delta > 0) soundFX.playHint2();
  };

  // 글자 수에 따른 반응형 카드 크기 계산
  const totalCharCount = allChars.length;
  const cardSizeClass =
    totalCharCount <= 4
      ? "w-32 sm:w-40 md:w-44 min-h-[11rem] sm:min-h-[13.5rem]"
      : totalCharCount <= 8
      ? "w-24 sm:w-32 md:w-36 min-h-[9.5rem] sm:min-h-[11.5rem]"
      : totalCharCount <= 14
      ? "w-20 sm:w-24 md:w-28 min-h-[8rem] sm:min-h-[9.5rem]"
      : "w-16 sm:w-20 md:w-24 min-h-[7rem] sm:min-h-[8.2rem]";

  const choseongFontClass =
    totalCharCount <= 4
      ? "text-6xl sm:text-7xl md:text-8xl"
      : totalCharCount <= 8
      ? "text-5xl sm:text-6xl md:text-7xl"
      : totalCharCount <= 14
      ? "text-4xl sm:text-5xl md:text-6xl"
      : "text-3xl sm:text-4xl md:text-5xl";

  const maxScore = Math.max(...teams.map((t) => t.score), 0);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-50 via-sky-50 to-amber-50 text-slate-800 select-none">
      {/* 상단 네비게이션 및 버전 선택 바 */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-indigo-100 px-4 sm:px-8 py-3.5 shadow-sm z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* 좌측: 로고 및 현재 퀴즈 버전 선택기 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 bg-indigo-600 text-white px-3.5 py-2 rounded-2xl shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="font-extrabold text-base sm:text-lg tracking-tight">
                교실 초성퀴즈
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 transition rounded-2xl px-3 py-1.5 border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-lg">
                퀴즈 버전
              </span>
              <select
                aria-label="퀴즈 버전 선택"
                value={activeSet.id}
                onChange={(e) => {
                  const found = allSets.find((s) => s.id === e.target.value);
                  if (found) onSelectSet(found);
                }}
                className="bg-transparent font-bold text-slate-800 text-sm sm:text-base focus:outline-none cursor-pointer pr-2"
              >
                {allSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.words.length}문제 · {s.source === "cloud" ? "클라우드" : "내 PC"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 우측: 문제 순서 컨트롤 & 도구 모음 & 관리자 모드 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsRandomOrder((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border transition ${
                isRandomOrder
                  ? "bg-amber-100/90 text-amber-900 border-amber-300"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title="랜덤 출제 / 입력 순서대로 출제 전환"
            >
              <Shuffle className="w-4 h-4" />
              <span>{isRandomOrder ? "랜덤 출제 중" : "순서대로 출제"}</span>
            </button>

            <button
              onClick={handleReshuffle}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 transition shadow-sm"
              title="단어 순서를 새로 무작위 섞기 (단축키 R)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">다시 섞기</span>
            </button>

            <button
              onClick={() => setShowWordListModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-sm"
              title="문제 목록 보기 및 이동"
            >
              <ListOrdered className="w-4 h-4" />
              <span className="hidden md:inline">목록</span>
            </button>

            <button
              onClick={() => setShowScoreboard((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border transition shadow-sm ${
                showScoreboard
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden md:inline">모둠 점수판</span>
            </button>

            <button
              onClick={toggleSound}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-sm"
              title={soundEnabled ? "효과음 켜짐" : "효과음 꺼짐"}
              aria-label="효과음 토글"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-sm"
              title="전체화면 전환"
              aria-label="전체화면 전환"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm sm:text-base font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition"
            >
              <Settings className="w-4 h-4 text-amber-300" />
              <span>관리자 모드 (문제 입력·버전 저장)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 중앙 메인 퀴즈 스테이지 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
        {/* 상단 문제 번호 및 힌트 상태 배지 */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-black text-lg sm:text-2xl shadow-md">
              문제 {currentIndex + 1} <span className="text-indigo-200 font-semibold text-base">/ {shuffledWords.length}</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-slate-600 font-bold text-sm sm:text-base shadow-sm">
              {activeSet.category} · 총 {hangulCharIndices.length}글자
              {wordGroups.length > 1 ? ` (${wordGroups.length}어절)` : ""}
            </span>
          </div>

          {/* 현재 활성화된 힌트 상태 표시 배지 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold border flex items-center gap-1.5 transition ${
                showHint1Batchim
                  ? "bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
                  : "bg-white/70 text-slate-400 border-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              1차 힌트(받침): {showHint1Batchim ? "공개됨" : "가려짐"}
            </span>

            <span
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold border flex items-center gap-1.5 transition ${
                revealedCharIndices.size > 0
                  ? "bg-sky-100 text-sky-900 border-sky-300 shadow-sm"
                  : hint2GuidePulse
                  ? "bg-sky-50 text-sky-800 border-sky-300 animate-pulse"
                  : "bg-white/70 text-slate-500 border-slate-200"
              }`}
            >
              <MousePointerClick className="w-4 h-4 text-sky-600" />
              2차 힌트(글자 클릭 모음 공개): {revealedCharIndices.size}글자 열림
            </span>
          </div>
        </div>

        {/* 메인 초성 카드 보드 */}
        <div className="w-full bg-white/85 backdrop-blur-md rounded-[2.25rem] border-2 border-indigo-100 shadow-xl p-6 sm:p-10 md:p-14 flex flex-col items-center justify-center min-h-[22rem] sm:min-h-[26rem] relative overflow-hidden">
          {/* 상단 안내 문구 */}
          <div className="mb-6 text-center">
            {isAnswerRevealed ? (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-base sm:text-lg border border-emerald-300 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>정답이 공개되었습니다! 다음 문제로 이동해 보세요</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-800 font-bold text-sm sm:text-base border border-indigo-200">
                <MousePointerClick className="w-4 h-4 text-indigo-600" />
                <span>
                  <strong>2차 힌트 팁:</strong> 원하는 글자 카드를 직접 클릭하면 그 글자만 모음까지 모두 공개됩니다!
                </span>
              </div>
            )}
          </div>

          {/* 어절 그룹별 글자 카드 렌더링 */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-6 w-full py-2">
            {wordGroups.map((group) => (
              <div
                key={group.wordIndex}
                className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4"
              >
                {group.chars.map((ch) => {
                  const isCharRevealed =
                    isAnswerRevealed || revealedCharIndices.has(ch.index) || !ch.isHangul;

                  return (
                    <button
                      key={ch.index}
                      type="button"
                      onClick={() => handleToggleCharReveal(ch.index)}
                      disabled={isAnswerRevealed || !ch.isHangul}
                      title={
                        isAnswerRevealed
                          ? ch.original
                          : revealedCharIndices.has(ch.index)
                          ? "다시 클릭하면 이 글자를 다시 가립니다"
                          : "클릭하면 이 글자의 모음까지 모두 공개합니다 (2차 힌트)"
                      }
                      className={`${cardSizeClass} rounded-3xl border-4 flex flex-col items-center justify-between p-3 sm:p-4 transition-all duration-200 relative group shadow-md ${
                        isAnswerRevealed
                          ? "bg-gradient-to-b from-emerald-500 to-teal-600 border-emerald-300 text-white scale-105 shadow-emerald-200/80 shadow-xl"
                          : revealedCharIndices.has(ch.index)
                          ? "bg-gradient-to-b from-sky-500 to-indigo-600 border-sky-300 text-white scale-105 shadow-sky-200/80 shadow-xl cursor-pointer"
                          : showHint1Batchim
                          ? "bg-white hover:bg-amber-50/70 border-amber-300 text-slate-900 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                          : "bg-white hover:bg-indigo-50/70 border-indigo-200 text-slate-900 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                      }`}
                    >
                      {/* 카드 상단 상태 미니 라벨 */}
                      <div className="w-full flex items-center justify-between text-[11px] sm:text-xs font-extrabold">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            isCharRevealed
                              ? "bg-white/25 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {ch.index + 1}번째
                        </span>

                        {isAnswerRevealed ? (
                          <span className="px-2 py-0.5 rounded-full bg-white/25 text-white">
                            정답
                          </span>
                        ) : revealedCharIndices.has(ch.index) ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-300 text-slate-900">
                            2차 힌트
                          </span>
                        ) : (
                          <span className="opacity-0 group-hover:opacity-100 transition text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            클릭 공개
                          </span>
                        )}
                      </div>

                      {/* 카드 중앙/상하 메인 텍스트 */}
                      {isCharRevealed ? (
                        /* 정답 공개 또는 2차 힌트(선택한 글자 모음까지 전체 공개) */
                        <div className="flex-1 flex flex-col items-center justify-center my-1">
                          <span className={`${choseongFontClass} font-black leading-none tracking-tight drop-shadow-sm`}>
                            {ch.original}
                          </span>
                        </div>
                      ) : showHint1Batchim ? (
                        /* 1차 힌트: 위쪽은 초성, 아래쪽은 받침 상하 배치 */
                        <div className="flex-1 w-full flex flex-col items-center justify-between my-1 gap-1.5">
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <span className="text-[11px] font-bold text-indigo-500 mb-0.5">
                              초성
                            </span>
                            <span
                              className={`${choseongFontClass} font-black text-indigo-950 leading-none`}
                            >
                              {ch.choseong}
                            </span>
                          </div>

                          <div className="w-full border-t-2 border-dashed border-amber-200 pt-1.5 flex flex-col items-center justify-center bg-amber-50/90 rounded-2xl py-1.5 px-2">
                            <span className="text-[10px] sm:text-xs font-bold text-amber-700">
                              받침(1차 힌트)
                            </span>
                            {ch.hasBatchim ? (
                              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-900 leading-tight">
                                {ch.jongseong}
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm font-extrabold text-slate-400 py-1">
                                받침 없음 (-)
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* 기본 상태: 초성만 표시 */
                        <div className="flex-1 w-full flex flex-col items-center justify-between my-1">
                          <div className="flex-1 flex items-center justify-center">
                            <span
                              className={`${choseongFontClass} font-black text-indigo-950 leading-none`}
                            >
                              {ch.choseong}
                            </span>
                          </div>
                          <div className="w-full pt-1.5 border-t border-slate-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition">
                              클릭 시 글자 공개
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 정답 공개 시 하단에 전체 문장 한 줄 요약 배너 */}
          {isAnswerRevealed && (
            <div className="mt-8 px-8 py-4 rounded-2xl bg-emerald-900 text-white font-black text-2xl sm:text-4xl tracking-wide shadow-lg text-center">
              {currentWord}
            </div>
          )}
        </div>

        {/* 교실 모둠 점수판 (토글 시 표시) */}
        {showScoreboard && (
          <div className="w-full mt-5 bg-white/95 backdrop-blur-md rounded-3xl border-2 border-emerald-200 p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                  교실 모둠 점수판
                </h3>
              </div>
              <button
                onClick={() =>
                  setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })))
                }
                className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
              >
                점수 초기화
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {teams.map((team) => {
                const isLeader = maxScore > 0 && team.score === maxScore;
                return (
                  <div
                    key={team.id}
                    className={`rounded-2xl p-3 border-2 flex flex-col items-center justify-between transition ${
                      isLeader
                        ? "bg-amber-50 border-amber-400 shadow-sm"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-extrabold text-sm text-slate-700">
                      {isLeader && <span>👑</span>}
                      <span>{team.name}</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1.5">
                      {team.score}
                      <span className="text-xs font-bold text-slate-500 ml-0.5">점</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        onClick={() => updateTeamScore(team.id, -10)}
                        className="flex-1 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 font-bold text-xs flex items-center justify-center"
                        aria-label={`${team.name} 감점`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateTeamScore(team.id, 10)}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-sm"
                        aria-label={`${team.name} 득점`}
                      >
                        <Plus className="w-3.5 h-3.5 mr-0.5" />
                        10
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 하단 대형 액션 컨트롤 바 */}
      <footer className="w-full bg-white/95 backdrop-blur-md border-t border-indigo-100 px-4 sm:px-8 py-4 shadow-lg z-20">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* 이전 문제 */}
          <button
            onClick={() => goToQuestion(currentIndex - 1)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-base sm:text-lg transition"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>이전 문제</span>
          </button>

          {/* 중앙: 1차 힌트 / 2차 힌트 / 정답 공개 */}
          <div className="flex flex-wrap items-center justify-center gap-3 flex-1">
            {/* 1차 힌트 버튼: 받침 공개 */}
            <button
              onClick={handleToggleHint1}
              disabled={isAnswerRevealed}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-extrabold text-base sm:text-lg border-2 transition shadow-md ${
                showHint1Batchim
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
              } disabled:opacity-50`}
            >
              <Layers className="w-5 h-5" />
              <span>
                {showHint1Batchim ? "1차 힌트: 받침 숨기기" : "1차 힌트: 받침 공개"}
              </span>
            </button>

            {/* 2차 힌트 버튼: 선택한 글자 모음까지 공개 (글자 클릭 안내 + 1글자 열기) */}
            <button
              onClick={handleRevealOneRandomChar}
              disabled={
                isAnswerRevealed ||
                revealedCharIndices.size >= hangulCharIndices.length
              }
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-extrabold text-base sm:text-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border-2 border-sky-300 transition shadow-md disabled:opacity-50"
              title="글자 카드를 직접 클릭하거나 이 버튼을 눌러 한 글자씩 모음까지 공개하세요"
            >
              <MousePointerClick className="w-5 h-5 text-sky-600" />
              <span>
                2차 힌트: 한 글자 열기 ({revealedCharIndices.size}/{hangulCharIndices.length})
              </span>
            </button>

            {/* 정답 공개 버튼 */}
            <button
              onClick={handleRevealAnswer}
              className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-base sm:text-xl transition shadow-lg ${
                isAnswerRevealed
                  ? "bg-slate-700 hover:bg-slate-800 text-white"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
              }`}
            >
              {isAnswerRevealed ? (
                <>
                  <EyeOff className="w-6 h-6" />
                  <span>정답 다시 가리기</span>
                </>
              ) : (
                <>
                  <Eye className="w-6 h-6" />
                  <span>정답 공개!</span>
                </>
              )}
            </button>
          </div>

          {/* 다음 문제 */}
          <button
            onClick={() => goToQuestion(currentIndex + 1)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base sm:text-lg transition shadow-md"
          >
            <span>다음 문제</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* 단축키 안내 바 */}
        <div className="max-w-6xl mx-auto mt-2.5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            키보드 단축키: <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">1</kbd> 1차 힌트(받침)
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">글자 클릭</kbd> 또는{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">2</kbd> 2차 힌트(한 글자 모음까지 공개)
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">Space</kbd> 정답 공개 / 다음 문제
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">←</kbd>{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">→</kbd> 문제 이동
          </span>
        </div>
      </footer>

      {/* 전체 문제 목록 모달 */}
      {showWordListModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  현재 출제 순서 목록 ({shuffledWords.length}문제)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  번호를 클릭하면 해당 문제로 즉시 이동합니다 (학생들에게 정답이 보이지 않도록 초성으로 표시됩니다)
                </p>
              </div>
              <button
                onClick={() => setShowWordListModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm"
              >
                닫기
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {shuffledWords.map((w, idx) => {
                const choseongPreview = decomposeText(w)
                  .map((c) => (c.isSpace ? " " : c.choseong))
                  .join("");
                const isSolved = solvedIndices.has(idx);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      goToQuestion(idx);
                      setShowWordListModal(false);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
                      isCurrent
                        ? "bg-indigo-600 text-white border-indigo-600 font-extrabold"
                        : isSolved
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                          isCurrent
                            ? "bg-white text-indigo-600"
                            : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-extrabold tracking-widest truncate">
                        {choseongPreview}
                      </span>
                    </div>
                    <span className="text-xs font-bold ml-2 shrink-0">
                      {isCurrent ? "진행 중" : isSolved ? "완료 ✓" : `${w.length}글자`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
