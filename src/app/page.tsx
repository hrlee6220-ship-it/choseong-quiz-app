"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, QuizSet, DEFAULT_QUIZ_SETS } from "@/lib/supabase";
import QuizPlayView from "@/components/QuizPlayView";
import QuizAdminView from "@/components/QuizAdminView";

const LOCAL_STORAGE_KEY = "choseong_quiz_saved_versions_v1";
const ACTIVE_SET_ID_KEY = "choseong_quiz_active_id_v1";

export default function HomePage() {
  const [mode, setMode] = useState<"play" | "admin">("play");
  const [localSets, setLocalSets] = useState<QuizSet[]>(DEFAULT_QUIZ_SETS);
  const [cloudSets, setCloudSets] = useState<QuizSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string>(DEFAULT_QUIZ_SETS[0].id);
  const [user, setUser] = useState<User | null>(null);

  // 1. 로컬 스토리지에서 저장된 퀴즈 버전 불러오기
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalSets(parsed);
        }
      }
      const savedActiveId = window.localStorage.getItem(ACTIVE_SET_ID_KEY);
      if (savedActiveId) {
        setActiveSetId(savedActiveId);
      }
    } catch {
      // ignore localStorage read errors
    }
  }, []);

  // 2. Supabase Auth 세션 및 클라우드 퀴즈 버전 불러오기
  const fetchCloudSets = useCallback(async () => {
    const { data, error } = await supabase
      .from("quiz_sets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      const mapped: QuizSet[] = data.map((row) => ({
        id: String(row.id),
        owner_id: row.owner_id,
        title: String(row.title),
        description: String(row.description || ""),
        category: String(row.category || "일반"),
        words: Array.isArray(row.words) ? row.words.map(String) : [],
        is_public: Boolean(row.is_public),
        source: "cloud",
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }));
      setCloudSets(mapped);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchCloudSets();
    });
    fetchCloudSets();
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchCloudSets]);

  // 로컬 버전 + 클라우드 버전 통합 (중복 제목/ID 정리)
  const allSets: QuizSet[] = React.useMemo(() => {
    const combined: QuizSet[] = [...localSets];
    for (const cSet of cloudSets) {
      if (!combined.some((l) => l.id === cSet.id)) {
        combined.push(cSet);
      }
    }
    return combined;
  }, [localSets, cloudSets]);

  const activeSet: QuizSet = React.useMemo(() => {
    return allSets.find((s) => s.id === activeSetId) || allSets[0] || DEFAULT_QUIZ_SETS[0];
  }, [allSets, activeSetId]);

  const persistLocalSets = (nextSets: QuizSet[]) => {
    setLocalSets(nextSets);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextSets));
      } catch {
        // ignore storage quota errors
      }
    }
  };

  const handleSelectSet = (set: QuizSet) => {
    setActiveSetId(set.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_SET_ID_KEY, set.id);
    }
  };

  // 버전 저장 (현재 버전 업데이트 또는 새 버전 추가)
  const handleSaveSet = async (target: QuizSet, asNewVersion = false): Promise<QuizSet> => {
    // 로그인된 경우 클라우드(Supabase)에도 저장
    if (user) {
      const isExistingCloudOwned =
        !asNewVersion &&
        cloudSets.some((c) => c.id === target.id && c.owner_id === user.id);

      if (isExistingCloudOwned) {
        const { data, error } = await supabase
          .from("quiz_sets")
          .update({
            title: target.title,
            description: target.description,
            category: target.category,
            words: target.words,
            is_public: target.is_public,
          })
          .eq("id", target.id)
          .select()
          .single();

        if (!error && data) {
          const savedCloud: QuizSet = {
            id: String(data.id),
            owner_id: data.owner_id,
            title: data.title,
            description: data.description || "",
            category: data.category || "일반",
            words: Array.isArray(data.words) ? data.words.map(String) : [],
            is_public: Boolean(data.is_public),
            source: "cloud",
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          await fetchCloudSets();
          handleSelectSet(savedCloud);
          return savedCloud;
        }
      } else {
        const { data, error } = await supabase
          .from("quiz_sets")
          .insert({
            owner_id: user.id,
            title: target.title,
            description: target.description,
            category: target.category,
            words: target.words,
            is_public: target.is_public,
          })
          .select()
          .single();

        if (!error && data) {
          const savedCloud: QuizSet = {
            id: String(data.id),
            owner_id: data.owner_id,
            title: data.title,
            description: data.description || "",
            category: data.category || "일반",
            words: Array.isArray(data.words) ? data.words.map(String) : [],
            is_public: Boolean(data.is_public),
            source: "cloud",
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          await fetchCloudSets();
          handleSelectSet(savedCloud);
          return savedCloud;
        }
      }
    }

    // 로컬 브라우저 저장
    const localTarget: QuizSet = {
      ...target,
      id: asNewVersion || target.source === "cloud" ? `local-${Date.now()}` : target.id,
      source: "local",
      updated_at: new Date().toISOString(),
    };

    const existsIdx = localSets.findIndex((s) => s.id === localTarget.id);
    let nextLocal: QuizSet[];
    if (existsIdx >= 0 && !asNewVersion) {
      nextLocal = localSets.map((s, idx) => (idx === existsIdx ? localTarget : s));
    } else {
      nextLocal = [localTarget, ...localSets];
    }

    persistLocalSets(nextLocal);
    handleSelectSet(localTarget);
    return localTarget;
  };

  // 버전 삭제
  const handleDeleteSet = async (target: QuizSet) => {
    if (target.source === "cloud" && user && target.owner_id === user.id) {
      await supabase.from("quiz_sets").delete().eq("id", target.id);
      await fetchCloudSets();
    } else {
      const nextLocal = localSets.filter((s) => s.id !== target.id);
      persistLocalSets(nextLocal.length > 0 ? nextLocal : DEFAULT_QUIZ_SETS);
    }
  };

  // 외부 JSON 버전 일괄 가져오기
  const handleImportSets = (imported: QuizSet[]) => {
    const nextLocal = [...imported, ...localSets];
    persistLocalSets(nextLocal);
    if (imported[0]) {
      handleSelectSet(imported[0]);
    }
  };

  if (mode === "admin") {
    return (
      <QuizAdminView
        allSets={allSets}
        activeSet={activeSet}
        user={user}
        onSaveSet={handleSaveSet}
        onDeleteSet={handleDeleteSet}
        onStartQuiz={(set) => {
          handleSelectSet(set);
          setMode("play");
        }}
        onImportSets={handleImportSets}
        onBackToPlay={() => setMode("play")}
      />
    );
  }

  return (
    <QuizPlayView
      activeSet={activeSet}
      allSets={allSets}
      onSelectSet={handleSelectSet}
      onOpenAdmin={() => setMode("admin")}
    />
  );
}
