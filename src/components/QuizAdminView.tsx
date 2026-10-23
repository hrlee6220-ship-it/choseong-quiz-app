"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Plus,
  Save,
  Copy,
  Trash2,
  Cloud,
  HardDrive,
  Upload,
  Download,
  Sparkles,
  LogIn,
  LogOut,
  CheckCircle2,
  ArrowLeft,
  CornerDownLeft,
  FileText,
  Wand2,
  Globe,
  Lock,
} from "lucide-react";
import { decomposeText, parseLinesToWords } from "@/lib/hangul";
import { QuizSet, supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface QuizAdminViewProps {
  allSets: QuizSet[];
  activeSet: QuizSet;
  user: User | null;
  onSaveSet: (set: QuizSet, asNewVersion?: boolean) => Promise<QuizSet>;
  onDeleteSet: (set: QuizSet) => Promise<void>;
  onStartQuiz: (set: QuizSet) => void;
  onImportSets: (sets: QuizSet[]) => void;
  onBackToPlay: () => void;
}

const CATEGORIES = ["국어·속담", "레크리에이션", "음악·예술", "사회·역사", "과학·상식", "학급활동", "기타"];

export default function QuizAdminView({
  allSets,
  activeSet,
  user,
  onSaveSet,
  onDeleteSet,
  onStartQuiz,
  onImportSets,
  onBackToPlay,
}: QuizAdminViewProps) {
  // 현재 편집 중인 퀴즈 세트 폼 상태
  const [editingId, setEditingId] = useState<string>(activeSet.id);
  const [title, setTitle] = useState<string>(activeSet.title);
  const [category, setCategory] = useState<string>(activeSet.category || "국어·속담");
  const [description, setDescription] = useState<string>(activeSet.description || "");
  const [rawText, setRawText] = useState<string>(activeSet.words.join("\n"));
  const [isPublic, setIsPublic] = useState<boolean>(activeSet.is_public);
  const [quickInput, setQuickInput] = useState<string>("");

  // 알림 메시지 및 저장 상태
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<"all" | "local" | "cloud">("all");

  // 교사 클라우드 계정 로그인/가입 상태
  const [teacherIdInput, setTeacherIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setEditingId(activeSet.id);
    setTitle(activeSet.title);
    setCategory(activeSet.category || "국어·속담");
    setDescription(activeSet.description || "");
    setRawText(activeSet.words.join("\n"));
    setIsPublic(activeSet.is_public);
  }, [activeSet]);

  const parsedWords = useMemo(() => parseLinesToWords(rawText), [rawText]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 빠른 한 줄 엔터 추가 핸들러
  const handleQuickEnterAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = quickInput.trim();
      if (!trimmed) return;
      setRawText((prev) => {
        const cleanPrev = prev.trim();
        return cleanPrev ? `${cleanPrev}\n${trimmed}` : trimmed;
      });
      setQuickInput("");
    }
  };

  // 개별 줄 삭제
  const handleRemoveWordAt = (idxToRemove: number) => {
    const next = parsedWords.filter((_, idx) => idx !== idxToRemove);
    setRawText(next.join("\n"));
  };

  // 중복 제거 및 빈 줄 정리
  const handleDeduplicate = () => {
    const unique = Array.from(new Set(parsedWords));
    setRawText(unique.join("\n"));
    showToast(`중복 및 빈 줄을 정리했습니다! (총 ${unique.length}문제)`);
  };

  // 새 빈 버전 작성 시작
  const handleCreateBlankVersion = () => {
    const newId = `local-${Date.now()}`;
    setEditingId(newId);
    setTitle(`우리 반 초성퀴즈 v${allSets.length + 1}`);
    setCategory("학급활동");
    setDescription("엔터로 단어나 문장을 입력해 만든 새 퀴즈 버전");
    setRawText("");
    setIsPublic(false);
    showToast("새 퀴즈 버전 입력창이 준비되었습니다. 단어를 엔터로 쭉 입력해 보세요!");
  };

  // 현재 버전 저장 또는 새 버전으로 저장
  const handleSave = async (asNewVersion = false) => {
    if (!title.trim()) {
      showToast("퀴즈 버전 이름을 입력해 주세요!");
      return;
    }
    if (parsedWords.length === 0) {
      showToast("최소 1개 이상의 단어나 문장을 입력해 주세요!");
      return;
    }

    setIsSaving(true);
    try {
      const targetTitle = asNewVersion
        ? title.includes("v")
          ? `${title} (사본)`
          : `${title} v2`
        : title.trim();

      const setPayload: QuizSet = {
        id: asNewVersion ? `local-${Date.now()}` : editingId,
        title: targetTitle,
        description: description.trim(),
        category,
        words: parsedWords,
        is_public: isPublic,
        source: user ? "cloud" : "local",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const saved = await onSaveSet(setPayload, asNewVersion);
      setEditingId(saved.id);
      setTitle(saved.title);
      showToast(
        asNewVersion
          ? `✨ '${saved.title}' 새 버전으로 저장되었습니다!`
          : `💾 '${saved.title}' 저장이 완료되었습니다!`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 저장 후 즉시 수업 시작
  const handleSaveAndStart = async () => {
    if (parsedWords.length === 0) {
      showToast("최소 1개 이상의 단어나 문장을 입력해 주세요!");
      return;
    }
    setIsSaving(true);
    try {
      const setPayload: QuizSet = {
        id: editingId,
        title: title.trim() || "교실 초성퀴즈",
        description: description.trim(),
        category,
        words: parsedWords,
        is_public: isPublic,
        source: user ? "cloud" : "local",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const saved = await onSaveSet(setPayload, false);
      onStartQuiz(saved);
    } finally {
      setIsSaving(false);
    }
  };

  // JSON 백업 내보내기
  const handleExportJson = () => {
    const dataStr = JSON.stringify(allSets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `choseong-quiz-versions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("전체 퀴즈 버전이 JSON 파일로 저장되었습니다.");
  };

  // JSON 파일 불러오기
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        if (Array.isArray(parsed)) {
          const validSets: QuizSet[] = parsed
            .filter((item) => item && typeof item.title === "string" && Array.isArray(item.words))
            .map((item, idx) => ({
              id: item.id || `imported-${Date.now()}-${idx}`,
              title: item.title,
              description: item.description || "",
              category: item.category || "기타",
              words: item.words.map((w: unknown) => String(w).trim()).filter(Boolean),
              is_public: Boolean(item.is_public),
              source: "local",
              created_at: item.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
          onImportSets(validSets);
          showToast(`${validSets.length}개의 퀴즈 버전을 성공적으로 불러왔습니다!`);
        }
      } catch {
        showToast("올바른 JSON 파일 형식이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 교사 클라우드 로그인 / 간편 가입
  const handleTeacherAuth = async (mode: "login" | "signup") => {
    setAuthError(null);
    const cleanId = teacherIdInput.trim();
    if (!cleanId || passwordInput.length < 6) {
      setAuthError("아이디(또는 이메일)와 비밀번호(6자 이상)를 입력해 주세요.");
      return;
    }
    const email = cleanId.includes("@")
      ? cleanId.toLowerCase()
      : `${cleanId.toLowerCase().replace(/[^a-z0-9._-]/g, "")}@choseong-teacher.local`;

    setAuthLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: passwordInput,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          // 자동 승인 트리거 적용으로 즉시 로그인 시도
          await supabase.auth.signInWithPassword({ email, password: passwordInput });
          showToast("교사 클라우드 계정이 생성되고 로그인되었습니다!");
          setTeacherIdInput("");
          setPasswordInput("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: passwordInput,
        });
        if (error) {
          setAuthError("아이디 또는 비밀번호를 확인해 주세요. 처음이시면 [1초 가입]을 눌러주세요.");
        } else {
          showToast("클라우드 계정에 로그인되었습니다!");
          setTeacherIdInput("");
          setPasswordInput("");
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("로그아웃되었습니다. 내 PC 저장 모드로 계속 이용할 수 있습니다.");
  };

  const filteredSets = useMemo(() => {
    if (filterTab === "local") return allSets.filter((s) => s.source === "local");
    if (filterTab === "cloud") return allSets.filter((s) => s.source === "cloud");
    return allSets;
  }, [allSets, filterTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* 상단 관리자 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPlay}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>수업 화면으로 돌아가기</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <h1 className="font-black text-lg sm:text-xl text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>초성퀴즈 관리자 스튜디오 & 다중 버전 보관함</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border-2 border-indigo-200 font-extrabold text-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>현재 버전 저장</span>
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 font-extrabold text-sm transition"
            >
              <Copy className="w-4 h-4" />
              <span>새 버전으로 추가 저장</span>
            </button>

            <button
              onClick={handleSaveAndStart}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base shadow-md transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>저장 후 바로 수업 시작</span>
            </button>
          </div>
        </div>
      </header>

      {/* 토스트 알림 배너 */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-sm border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 메인 2단 그리드: 좌측 버전 관리 보관함 / 우측 엔터 연속 입력 에디터 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측 (5열): 여러 버전의 퀴즈 보관함 & 클라우드 동기화 */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* 버전 리스트 카드 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">
                  저장된 퀴즈 버전 목록 ({allSets.length}개)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  수업 주제나 학급별로 여러 버전의 퀴즈를 만들어 두고 언제든 불러오세요
                </p>
              </div>
              <button
                onClick={handleCreateBlankVersion}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>새 버전 만들기</span>
              </button>
            </div>

            {/* 필터 탭 & 백업 도구 */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  전체 ({allSets.length})
                </button>
                <button
                  onClick={() => setFilterTab("local")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterTab === "local" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  내 PC ({allSets.filter((s) => s.source === "local").length})
                </button>
                <button
                  onClick={() => setFilterTab("cloud")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterTab === "cloud" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  클라우드 ({allSets.filter((s) => s.source === "cloud").length})
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  title="모든 퀴즈 버전을 파일로 백업"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>백업</span>
                </button>
                <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>불러오기</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 버전 아이템 스크롤 영역 */}
            <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
              {filteredSets.map((set) => {
                const isSelected = set.id === editingId;
                const canModifyCloud =
                  set.source === "local" || (user && set.owner_id === user.id);

                return (
                  <div
                    key={set.id}
                    onClick={() => {
                      setEditingId(set.id);
                      setTitle(set.title);
                      setCategory(set.category);
                      setDescription(set.description);
                      setRawText(set.words.join("\n"));
                      setIsPublic(set.is_public);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-500 shadow-sm"
                        : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                            {set.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                              set.source === "cloud"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {set.source === "cloud" ? (
                              <>
                                <Cloud className="w-3 h-3" /> 클라우드
                              </>
                            ) : (
                              <>
                                <HardDrive className="w-3 h-3" /> 내 PC
                              </>
                            )}
                          </span>
                          <span className="text-xs font-extrabold text-slate-500">
                            {set.words.length}문제
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                          {set.title}
                        </h3>
                        {set.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {set.description}
                          </p>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onStartQuiz(set)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm"
                          title="이 버전으로 즉시 수업 시작"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>시작</span>
                        </button>
                        {canModifyCloud && allSets.length > 1 && (
                          <button
                            onClick={() => onDeleteSet(set)}
                            className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
                            title="버전 삭제"
                            aria-label={`${set.title} 삭제`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 클라우드 교사 계정 연동 카드 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-5 h-5 text-sky-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                교실 간 클라우드 버전 동기화 (선택)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              로그인하지 않아도 현재 컴퓨터 브라우저에 자동 저장됩니다. 다른 교실 PC에서도 내 퀴즈 버전을 그대로 불러오려면 교사 아이디로 로그인하세요.
            </p>

            {user ? (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-700">클라우드 연결됨</div>
                  <div className="font-extrabold text-sm text-slate-900">
                    {user.email?.replace("@choseong-teacher.local", "")} 선생님
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={teacherIdInput}
                    onChange={(e) => setTeacherIdInput(e.target.value)}
                    placeholder="교사 아이디 (예: teacher01)"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="비밀번호 (6자 이상)"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {authError && (
                  <p className="text-xs font-bold text-rose-600">{authError}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTeacherAuth("login")}
                    disabled={authLoading}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>클라우드 로그인</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTeacherAuth("signup")}
                    disabled={authLoading}
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>1초 간편 가입</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 우측 (7열): 엔터 연속 입력 퀴즈 에디터 및 실시간 초성·받침 미리보기 */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            {/* 버전 메타데이터 입력 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-5">
              <div className="sm:col-span-7">
                <label className="block text-xs font-extrabold text-slate-600 mb-1">
                  퀴즈 버전 이름
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 2학년 3반 국어 속담 퀴즈 v1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-extrabold text-slate-600 mb-1">
                  카테고리
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setIsPublic((prev) => !prev)}
                  className={`w-full py-2.5 px-3 rounded-xl border font-extrabold text-xs flex items-center justify-center gap-1 transition ${
                    isPublic
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                  title="클라우드 저장 시 다른 선생님에게 공개 여부"
                >
                  {isPublic ? (
                    <>
                      <Globe className="w-3.5 h-3.5" /> 공개
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> 나만 보기
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-extrabold text-slate-600 mb-1">
                버전 메모 / 설명 (선택)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 1단원 핵심 어휘 복습용 (수업 도입 10분)"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 빠른 한 줄 엔터 추가 입력바 */}
            <div className="bg-indigo-50/90 border-2 border-indigo-200 rounded-2xl p-4 mb-5">
              <label className="block text-xs font-extrabold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                <CornerDownLeft className="w-4 h-4 text-indigo-600" />
                <span>빠른 엔터(Enter) 연속 입력창 — 단어나 문장을 치고 엔터만 누르세요!</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={handleQuickEnterAdd}
                  placeholder="여기에 단어나 문장을 입력하고 Enter 키를 치면 아래 목록에 바로 추가됩니다..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white border border-indigo-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = quickInput.trim();
                    if (!trimmed) return;
                    setRawText((prev) => (prev.trim() ? `${prev.trim()}\n${trimmed}` : trimmed));
                    setQuickInput("");
                  }}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shrink-0"
                >
                  추가
                </button>
              </div>
            </div>

            {/* 멀티라인 엔터 직접 편집창 */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>
                    전체 단어·문장 줄바꿈 편집창 (한 줄에 1문제 · 현재{" "}
                    <strong className="text-indigo-600">{parsedWords.length}문제</strong>)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeduplicate}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>중복·빈 줄 정리</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRawText("")}
                    className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition"
                  >
                    전체 비우기
                  </button>
                </div>
              </div>

              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  "단어나 문장을 엔터(Enter)만 치면서 한 줄에 하나씩 쭉 입력하세요!\n예시:\n훈민정음\n가는 말이 고와야 오는 말이 곱다\n초코칩쿠키"
                }
                className="w-full p-4 rounded-2xl border-2 border-slate-300 font-bold text-base text-slate-900 leading-relaxed focus:outline-none focus:border-indigo-500 bg-slate-50/40"
              />
            </div>

            {/* 실시간 초성 & 1차 힌트(받침) 분해 미리보기 */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm text-slate-800">
                  실시간 초성 & 1차 힌트(받침) 자동 변환 미리보기 ({parsedWords.length}개)
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  수업 시작 시 아래 단어들이 랜덤으로 섞여 출제됩니다
                </span>
              </div>

              {parsedWords.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-sm text-slate-400 font-bold">
                  위 입력창에 단어나 문장을 입력하고 엔터를 치면 초성과 받침 미리보기가 여기에 표시됩니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {parsedWords.map((word, idx) => {
                    const decomposed = decomposeText(word);
                    const choseongStr = decomposed
                      .map((c) => (c.isSpace ? " " : c.choseong))
                      .join("");
                    const batchimList = decomposed
                      .filter((c) => c.isHangul)
                      .map((c) => (c.hasBatchim ? c.jongseong : "-"))
                      .join(" ");

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm truncate">
                              {word}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-slate-500 pl-7">
                            <span className="text-indigo-700">초성: {choseongStr}</span>
                            <span>·</span>
                            <span className="text-amber-700">받침: {batchimList}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveWordAt(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition shrink-0"
                          title="이 문제 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
