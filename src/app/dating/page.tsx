'use client';

import React, { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Heart, LoaderCircle } from 'lucide-react';
import type { ExamPrompt } from '@/utils/examPrompts';
import {
  fetchExamPrompts,
  getExamApiSettingsSnapshot,
  getServerExamApiSettingsSnapshot,
  parseExamApiSettingsSnapshot,
  subscribeToExamApiSettings,
} from '@/lib/examApi';
import {
  buildPromptsUrlQuery,
  filterExamPrompts,
  parsePromptsUrlQuery,
} from '@/app/prompts/utils';
import type { PartFilter, SkillFilter } from '@/app/prompts/types';
import { DatingDeckApp } from './components/DatingDeckApp';

function DatingAppContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const settingsSnapshot = useSyncExternalStore(
    subscribeToExamApiSettings,
    getExamApiSettingsSnapshot,
    getServerExamApiSettingsSnapshot
  );
  const settings = parseExamApiSettingsSnapshot(settingsSnapshot);

  const [allPrompts, setAllPrompts] = useState<ExamPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load prompts once on mount; leaving /dating unmounts this page and resets everything
  useEffect(() => {
    let cancelled = false;
    fetchExamPrompts()
      .then((data) => {
        if (cancelled) return;
        setAllPrompts(data);
        setLoadError('');
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Không thể tải danh sách đề thi.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve active filters from URL (configured from /prompts), falling back to global school/batch settings
  const filters = useMemo(() => {
    const parsed = parsePromptsUrlQuery(queryString);
    const hasUrlParams = Boolean(queryString.trim());

    const school =
      parsed.school !== undefined
        ? parsed.school
        : !hasUrlParams && settings.school
          ? settings.school
          : 'all';
    const batch =
      parsed.batch !== undefined
        ? parsed.batch
        : !hasUrlParams && settings.batch
          ? settings.batch
          : 'all';
    const skill: SkillFilter = parsed.skill ?? 'all';
    const part: PartFilter = parsed.part ?? 'all';
    const search = parsed.search ?? '';

    return { school, batch, skill, part, search };
  }, [queryString, settings.school, settings.batch]);

  const filteredPrompts = useMemo(
    () => filterExamPrompts(allPrompts, filters),
    [allPrompts, filters]
  );

  const backHref = useMemo(() => {
    const qs = buildPromptsUrlQuery({
      school: filters.school,
      batch: filters.batch,
      skill: filters.skill,
      part: filters.part,
      search: filters.search,
    });
    return qs ? `/prompts?${qs}` : '/prompts';
  }, [filters]);

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 top-0 bottom-12 z-40 flex flex-col items-center justify-center bg-background p-6 text-center overflow-hidden overscroll-none space-y-3">
        <span className="btn-dating-pink grid h-12 w-12 place-items-center rounded-2xl">
          <Heart className="h-6 w-6 fill-white text-white animate-pulse" />
        </span>
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin text-pink-500" />
          <span>Đang chuẩn bị bộ thẻ đề thi VSTEP...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fixed inset-x-0 top-0 bottom-12 z-40 flex flex-col items-center justify-center bg-background p-6 text-center overflow-hidden overscroll-none space-y-3">
        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{loadError}</p>
        <Link
          href={backHref}
          className="btn-metallic-silver inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-black transition active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Ngân hàng đề</span>
        </Link>
      </div>
    );
  }

  if (filteredPrompts.length === 0) {
    return (
      <div className="fixed inset-x-0 top-0 bottom-12 z-40 flex flex-col items-center justify-center bg-background p-6 text-center overflow-hidden overscroll-none space-y-3">
        <span className="btn-dating-pink grid h-12 w-12 place-items-center rounded-2xl opacity-80">
          <Heart className="h-6 w-6 fill-white text-white" />
        </span>
        <h1 className="text-base font-black text-foreground">
          Không có đề thi phù hợp bộ lọc hiện tại
        </h1>
        <p className="text-xs text-muted-foreground max-w-sm">
          Hãy điều chỉnh lại Trường, Đợt thi, Kỹ năng hoặc từ khóa bên Ngân hàng đề rồi quay lại ôn nhé.
        </p>
        <Link
          href={backHref}
          className="btn-dating-pink inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-black transition hover:brightness-110 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Ngân hàng đề</span>
        </Link>
      </div>
    );
  }

  // Keyed by queryString so any filter change starts a clean fresh session
  return (
    <DatingDeckApp
      key={queryString || 'default'}
      prompts={filteredPrompts}
      backHref={backHref}
      filterSummary={filters}
    />
  );
}

export default function DatingAppPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-x-0 top-0 bottom-12 z-40 flex items-center justify-center bg-background overflow-hidden overscroll-none">
          <LoaderCircle className="h-5 w-5 animate-spin text-pink-500" />
        </div>
      }
    >
      <DatingAppContent />
    </Suspense>
  );
}

