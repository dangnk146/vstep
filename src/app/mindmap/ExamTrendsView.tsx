'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  Building2,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  X,
  Info,
  Layers,
  Sparkles,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import {
  type ClassifiedExamRecord,
  type TrendBadgeType,
  type TrendDatasetResponse,
  type TrendFilterState,
  type TrendSkillFilter,
  HUB_META,
  THEMATIC_HUB_IDS,
  computeTrendReport,
  formatFullDate,
  formatShortDate,
} from '@/lib/examTrendsShared';

interface ExamTrendsViewProps {
  dataset: TrendDatasetResponse | null;
  isLoading: boolean;
  error: string | null;
  initialFocusSubtopicId?: string | null;
  onClearFocusSubtopic?: () => void;
  onJumpToSubtopic: (hubId: string, subtopicId: string) => void;
}

type RankingTab = 'multi-school' | 'emerging' | 'recent14d' | 'all';
type UnclassifiedScope = 'all' | 'latest' | 'new';

const SKILL_OPTIONS: { value: TrendSkillFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả kỹ năng' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'speaking-part1', label: 'SP Part 1' },
  { value: 'speaking-part2', label: 'SP Part 2' },
  { value: 'speaking-part3', label: 'SP Part 3' },
  { value: 'writing-task1', label: 'Writing Task 1' },
  { value: 'writing-task2', label: 'Writing Task 2' },
];

const BADGE_CONFIG: Record<
  TrendBadgeType,
  { label: string; className: string; title: string }
> = {
  emerging: {
    label: 'Mới xuất hiện',
    className:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    title: 'Ghi nhận tối thiểu 2 lượt (hoặc 2 trường) ở đợt hiện tại và bằng 0 ở kỳ nền',
  },
  rising: {
    label: 'Tăng tỷ trọng',
    className:
      'bg-sky-50 text-[#245b86] border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/70',
    title: 'Đạt tối thiểu 3 lượt ở đợt hiện tại với biến thiên từ +1,0 điểm phần trăm và tăng tương đối từ 25%',
  },
  'multi-school': {
    label: 'Liên trường',
    className:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
    title: 'Xuất hiện đồng thời tại từ 3 hội đồng thi khác nhau trở lên',
  },
  steady: {
    label: 'Ổn định',
    className:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    title: 'Duy trì đều qua từ 2 đợt thi trở lên với biến động tỷ trọng nhỏ hơn 1,0 điểm phần trăm',
  },
};

function getPracticeHref(exam: ClassifiedExamRecord): string {
  const qs = `exam=${encodeURIComponent(exam.id)}`;
  if (exam.skill === 'speaking') {
    return `/speaking/${exam.part}?${qs}`;
  }
  const taskSlug = exam.part === 'part1' ? 'task1' : 'task2';
  return `/writing/${taskSlug}?${qs}`;
}

function formatPartLabel(exam: ClassifiedExamRecord): string {
  if (exam.skill === 'speaking') {
    return `SP ${exam.part.replace('part', 'P')}`;
  }
  return `WR ${exam.part.replace('part', 'T')}`;
}

function formatDeltaPp(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)} pp`;
  if (delta < 0) return `${delta.toFixed(1)} pp`;
  return '0,0 pp';
}

function deltaToneClass(delta: number): string {
  if (delta >= 1) return 'text-emerald-700 dark:text-emerald-400 font-bold';
  if (delta <= -1) return 'text-rose-700 dark:text-rose-400 font-bold';
  return 'text-slate-500 dark:text-slate-400 font-semibold';
}

function heatmapCellStyle(share: number, count: number): string {
  if (count === 0) {
    return 'bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600 border-slate-200/70 dark:border-slate-800/70';
  }
  if (share >= 35) {
    return 'bg-[#245b86] text-white border-[#245b86] dark:bg-sky-600 dark:border-sky-500 font-bold';
  }
  if (share >= 20) {
    return 'bg-[#245b86]/75 text-white border-[#245b86]/80 dark:bg-sky-700/80 dark:border-sky-600 font-semibold';
  }
  if (share >= 10) {
    return 'bg-sky-100 text-[#245b86] border-sky-200 dark:bg-sky-950/90 dark:text-sky-200 dark:border-sky-800 font-semibold';
  }
  return 'bg-sky-50/70 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800';
}

export function ExamTrendsView({
  dataset,
  isLoading,
  error,
  initialFocusSubtopicId,
  onClearFocusSubtopic,
  onJumpToSubtopic,
}: ExamTrendsViewProps) {
  const initialTargetSub = initialFocusSubtopicId
    ? dataset?.subtopics.find((s) => s.id === initialFocusSubtopicId)
    : undefined;

  const [filters, setFilters] = useState<TrendFilterState>(() => ({
    skill: initialTargetSub?.hubId === 'letters' ? 'writing-task1' : 'all',
    school: 'all',
    includeSeptBaseline: false,
    hubFilter:
      initialTargetSub && initialTargetSub.hubId !== 'letters'
        ? initialTargetSub.hubId
        : 'all',
  }));
  const [rankingTab, setRankingTab] = useState<RankingTab>(() =>
    initialFocusSubtopicId ? 'all' : 'multi-school'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubtopicId, setExpandedSubtopicId] = useState<string | null>(
    initialFocusSubtopicId || null
  );
  const [unclassifiedScope, setUnclassifiedScope] =
    useState<UnclassifiedScope>('all');
  const [showMethodology, setShowMethodology] = useState(false);

  const report = useMemo(() => {
    if (!dataset) return null;
    return computeTrendReport(
      dataset.records,
      dataset.subtopics,
      dataset.batches,
      dataset.latestExamDate,
      filters
    );
  }, [dataset, filters]);

  const displayedSubtopics = useMemo(() => {
    if (!report) return [];
    let rows = [...report.subtopicRows];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter(
        (row) =>
          row.title.toLowerCase().includes(q) ||
          row.viTitle.toLowerCase().includes(q) ||
          row.enTitle.toLowerCase().includes(q) ||
          row.exams.some(
            (e) =>
              e.title.toLowerCase().includes(q) ||
              e.school.toLowerCase().includes(q)
          )
      );
    }

    if (rankingTab === 'emerging') {
      rows = rows.filter(
        (r) => r.badges.includes('emerging') || r.badges.includes('rising')
      );
      rows.sort(
        (a, b) =>
          b.deltaPp - a.deltaPp ||
          b.latestCount - a.latestCount ||
          b.schoolCount - a.schoolCount
      );
    } else if (rankingTab === 'recent14d') {
      rows = rows.filter((r) => r.recent14dCount > 0);
      rows.sort(
        (a, b) =>
          b.recent14dCount - a.recent14dCount ||
          b.schoolCount - a.schoolCount ||
          b.latestCount - a.latestCount
      );
    } else if (rankingTab === 'multi-school') {
      rows = rows.filter((r) => r.totalCount > 0);
      rows.sort(
        (a, b) =>
          b.schoolCount - a.schoolCount ||
          b.latestCount - a.latestCount ||
          b.totalCount - a.totalCount
      );
    } else {
      rows.sort(
        (a, b) =>
          b.totalCount - a.totalCount ||
          b.schoolCount - a.schoolCount ||
          a.viTitle.localeCompare(b.viTitle)
      );
    }

    return rows;
  }, [report, rankingTab, searchQuery]);

  const filteredUnclassified = useMemo(() => {
    if (!report) return [];
    let list = report.unclassifiedExams;
    if (unclassifiedScope === 'latest') {
      list = list.filter((e) => e.batch === report.latestBatch);
    } else if (unclassifiedScope === 'new') {
      list = list.filter((e) => e.isNew);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.school.toLowerCase().includes(q)
      );
    }
    return list;
  }, [report, unclassifiedScope, searchQuery]);

  if (isLoading) {
    return (
      <div className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 flex flex-col items-center justify-center space-y-2.5 min-h-[360px] shadow-xs">
        <BarChart3 className="h-7 w-7 animate-pulse text-[#245b86] dark:text-sky-400" />
        <p className="text-sm font-bold text-foreground">
          Đang tổng hợp số liệu từ ngân hàng đề thi...
        </p>
        <p className="text-xs text-muted-foreground">
          Tính tỷ trọng chuẩn hóa theo đợt, độ phủ liên trường và cửa sổ ngày thi gần đây.
        </p>
      </div>
    );
  }

  if (error || !dataset || !report) {
    return (
      <div className="rounded-sm border border-rose-300 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-800 dark:text-rose-200 space-y-1">
        <p className="font-bold">Không thể tải phân tích xu hướng đề thi</p>
        <p>{error || 'Dữ liệu đầu vào chưa sẵn sàng.'}</p>
      </div>
    );
  }

  const isLetterMode = filters.skill === 'writing-task1';
  const maxHubShare = Math.max(
    1,
    ...report.hubRows.map((h) => Math.max(h.latestShare, h.baselineShare))
  );
  const matrixRows = isLetterMode
    ? report.letterSummary.byCategory.map((c) => ({
        id: c.subtopicId,
        label: c.viTitle,
      }))
    : THEMATIC_HUB_IDS.map((id) => ({
        id,
        label: HUB_META[id].shortLabel,
      }));

  const scrollToUnclassified = () => {
    const el = document.getElementById('unclassified-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-3 select-text">
      {/* 1. THANH BỘ LỌC & PHẠM VI PHÂN TÍCH */}
      <section className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {SKILL_OPTIONS.map((opt) => {
              const active = filters.skill === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onClearFocusSubtopic?.();
                    setFilters((prev) => ({
                      ...prev,
                      skill: opt.value,
                      hubFilter: 'all',
                    }));
                  }}
                  className={`h-7 rounded-xs px-2.5 text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-[#245b86] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ lọc trường (hỗ trợ kiểm tra độ nhạy Ngoài VLU) */}
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <select
                aria-label="Lọc theo hội đồng thi"
                value={filters.school}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, school: e.target.value }))
                }
                className="h-7 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 text-xs font-semibold text-foreground outline-none focus:border-[#245b86] cursor-pointer"
              >
                <option value="all">
                  Tất cả {dataset.schools.length} trường
                </option>
                <option value="non-vlu">
                  Ngoài VLU ({Math.max(0, dataset.schools.length - 1)} trường)
                </option>
                {dataset.schools.map((sc) => (
                  <option key={sc} value={sc}>
                    Trường {sc}
                  </option>
                ))}
              </select>
            </div>

            {/* Công tắc tách/gộp đợt 09/2026 */}
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  includeSeptBaseline: !prev.includeSeptBaseline,
                }))
              }
              title="Đợt 09/2026 là bộ ngân hàng ôn tập riêng của VLU chưa gắn ngày thi. Mặc định tách riêng khi tính biến thiên Δ pp giữa 10/2026 và 11/2026."
              className={`flex h-7 items-center gap-1.5 rounded-xs border px-2.5 text-xs font-semibold transition cursor-pointer ${
                filters.includeSeptBaseline
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Kỳ nền: {filters.includeSeptBaseline ? 'Gộp 09+10/2026' : 'Tách 09/2026 (chỉ 10/2026)'}
              </span>
            </button>

            {/* Nút nhảy nhanh xuống mục tách riêng Đề chưa gom nhánh */}
            <button
              type="button"
              onClick={scrollToUnclassified}
              className="flex h-7 items-center gap-1 rounded-xs border border-amber-300/80 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 px-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/70 transition cursor-pointer"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Chưa gom nhánh ({report.unclassifiedExams.length})</span>
            </button>
          </div>
        </div>

        {/* Ghi chú nền so sánh minh bạch */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[11px] text-muted-foreground">
          <span>
            Phạm vi so sánh biến thiên:{' '}
            <strong className="text-foreground">
              Kỳ nền {report.baselineLabel} (n = {report.baselineTotal})
            </strong>{' '}
            đối chiếu{' '}
            <strong className="text-foreground">
              Đợt {report.latestBatch} (n = {report.latestBatchTotal})
            </strong>
            . Mọi so sánh đều chuẩn hóa theo tỷ trọng phần trăm trong từng đợt.
          </span>
          {filters.includeSeptBaseline && (
            <span className="text-amber-700 dark:text-amber-400 font-semibold">
              Lưu ý: Đợt 09/2026 chỉ gồm dữ liệu VLU không gắn ngày thi cụ thể.
            </span>
          )}
        </div>
      </section>

      {/* 2. DẢI CHỈ SỐ KIỂM TOÁN DỮ LIỆU (4 THẺ) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Mẫu phân tích & Độ phủ Mindmap
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {report.totalRecords}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {report.overallCoveragePct}% khớp nhánh
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {report.overallClassified} đề thuộc nhánh Mindmap •{' '}
            {report.overallUnclassified} đề tách riêng
          </p>
        </div>

        <div className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Độ phủ Hội đồng thi
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {report.activeSchools.length}
              <span className="text-sm font-semibold text-muted-foreground">
                /{dataset.schools.length}
              </span>
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              trường đại học
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {filters.school === 'non-vlu'
              ? 'Đang kiểm chứng nhóm ngoài VLU'
              : `Tỷ trọng VLU: ${report.vluSharePct}% (${report.vluCount} đề)`}
          </p>
        </div>

        <div className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cửa sổ 14 ngày thi gần đây
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[#245b86] dark:text-sky-400">
              {report.recent14dCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              đề có ngày thi
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {report.recentWindowStart && report.latestExamDate
              ? `${formatShortDate(report.recentWindowStart)} đến ${formatFullDate(report.latestExamDate)} (${report.datedCount} đề gắn ngày)`
              : 'Không có đề gắn ngày trong bộ lọc hiện tại'}
          </p>
        </div>

        <div className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tín hiệu biến động ({report.latestBatch})
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
              {report.emergingCount}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              mới xuất hiện
            </span>
            <span className="text-xs font-bold text-[#245b86] dark:text-sky-400">
              • {report.risingCount} tăng tỷ trọng
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {report.multiSchoolCount} chủ đề phủ từ 3 trường trở lên
          </p>
        </div>
      </section>

      {/* 3. KHỐI A: PHÂN BỔ & BIẾN THIÊN TỶ TRỌNG 5 TOPIC HUBS (HOẶC 6 DẠNG THƯ) */}
      <section className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#245b86] dark:text-sky-300 flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {isLetterMode
                ? 'Tỷ trọng & Biến thiên 6 Dạng Thư Writing Task 1'
                : 'Tỷ trọng & Biến thiên 5 Topic Hubs (Speaking & Writing Task 2)'}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isLetterMode
                ? `Tính trên ${report.letterTotal} đề Writing Task 1 (nền ${report.baselineLabel} vs đợt ${report.latestBatch}).`
                : `Tính trên ${report.thematicTotal} đề chủ đề (Speaking + Writing Task 2). Nhóm chưa gom nhánh (${report.thematicUnclassified} đề) tách riêng, không cộng dồn vào Society.`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="inline-block h-2.5 w-2.5 rounded-2xs bg-slate-300 dark:bg-slate-600" />
              Nền ({report.baselineLabel})
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[#245b86] dark:text-sky-300">
              <span className="inline-block h-2.5 w-2.5 rounded-2xs bg-[#245b86] dark:bg-sky-500" />
              Đợt {report.latestBatch}
            </span>
            {filters.hubFilter !== 'all' && !isLetterMode && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, hubFilter: 'all' }))
                }
                className="rounded-xs border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[11px] font-bold text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Bỏ lọc Hub
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {report.hubRows.map((hub) => {
            const isSelected = !isLetterMode && filters.hubFilter === hub.hubId;
            const latestWidth = Math.max(
              hub.latestCount > 0 ? 3 : 0,
              Math.round((hub.latestShare / maxHubShare) * 100)
            );
            const baselineWidth = Math.max(
              hub.baselineCount > 0 ? 3 : 0,
              Math.round((hub.baselineShare / maxHubShare) * 100)
            );

            return (
              <div
                key={hub.hubId}
                onClick={() => {
                  if (isLetterMode) return;
                  setFilters((prev) => ({
                    ...prev,
                    hubFilter: prev.hubFilter === hub.hubId ? 'all' : hub.hubId,
                  }));
                }}
                className={`rounded-xs border p-2.5 transition ${
                  isLetterMode ? '' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-[#245b86] bg-sky-50/50 dark:border-sky-500 dark:bg-sky-950/30'
                    : 'border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {hub.vietnameseTitle}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-muted-foreground">
                      ({hub.title})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] shrink-0">
                    <span className="text-muted-foreground">
                      Tổng: <strong className="text-foreground">{hub.totalCount}</strong> ({hub.totalShare}%)
                    </span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{hub.schoolCount}</strong> trường
                    </span>
                    <span className={deltaToneClass(hub.deltaPp)}>
                      {formatDeltaPp(hub.deltaPp)}
                    </span>
                  </div>
                </div>

                {/* Dual normalized percentage bars */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-16 shrink-0 text-slate-500 dark:text-slate-400">
                      {report.baselineLabel}
                    </span>
                    <div className="flex-1 h-2.5 rounded-2xs bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-2xs bg-slate-400/80 dark:bg-slate-500 transition-all duration-300"
                        style={{ width: `${baselineWidth}%` }}
                      />
                    </div>
                    <span className="w-20 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      {hub.baselineShare}% ({hub.baselineCount})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-16 shrink-0 font-bold text-[#245b86] dark:text-sky-300">
                      {report.latestBatch}
                    </span>
                    <div className="flex-1 h-2.5 rounded-2xs bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-2xs bg-[#245b86] dark:bg-sky-500 transition-all duration-300"
                        style={{ width: `${latestWidth}%` }}
                      />
                    </div>
                    <span className="w-20 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      {hub.latestShare}% ({hub.latestCount})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. KHỐI B: BẢNG XẾP HẠNG CHỦ ĐỀ CON KÈM ĐỐI SOÁT ĐỀ GỐC */}
      <section className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#245b86] dark:text-sky-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              {isLetterMode
                ? 'Chi tiết 6 Dạng Thư & Đề thi thực tế đối chiếu'
                : 'Xếp hạng Chủ đề con Thực nghiệm & Đối soát đề gốc'}
              {filters.hubFilter !== 'all' && !isLetterMode && (
                <span className="rounded-xs bg-sky-100 dark:bg-sky-950 px-1.5 py-0.5 text-[10px] font-bold text-[#245b86] dark:text-sky-300">
                  Hub: {HUB_META[filters.hubFilter]?.shortLabel || filters.hubFilter}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Bấm vào từng dòng để xem toàn bộ đề gốc khớp với chủ đề, nhảy về nhánh Mindmap hoặc mở luyện tập trực tiếp.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc chủ đề, tên đề, mã trường..."
              className="h-7 w-full rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-7 text-xs text-foreground outline-none focus:border-[#245b86]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Tab góc nhìn thực nghiệm */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'multi-school', label: 'Độ phủ liên trường' },
              {
                id: 'emerging',
                label: `Mới xuất hiện & Tăng tỷ trọng (${report.emergingCount + report.risingCount})`,
              },
              { id: 'recent14d', label: '14 ngày gần đây' },
              { id: 'all', label: `Tất cả (${report.subtopicRows.length})` },
            ] as { id: RankingTab; label: string }[]
          ).map((tab) => {
            const active = rankingTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRankingTab(tab.id)}
                className={`h-7 rounded-xs px-2.5 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#245b86] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {displayedSubtopics.length === 0 ? (
          <div className="rounded-xs border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-xs text-muted-foreground">
            Không có chủ đề nào thỏa mãn điều kiện lọc hiện tại. Thử chuyển sang tab &quot;Tất cả&quot; hoặc mở rộng bộ lọc trường/kỹ năng.
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xs overflow-hidden">
            {displayedSubtopics.map((row, idx) => {
              const isExpanded = expandedSubtopicId === row.subtopicId;
              return (
                <div key={row.subtopicId} className="bg-white dark:bg-slate-900">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setExpandedSubtopicId(isExpanded ? null : row.subtopicId)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedSubtopicId(isExpanded ? null : row.subtopicId);
                      }
                    }}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-2 px-3 py-2.5 transition cursor-pointer ${
                      isExpanded
                        ? 'bg-sky-50/60 dark:bg-sky-950/30'
                        : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-2xs bg-slate-100 dark:bg-slate-800 px-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {idx + 1}
                        </span>
                        <span className="rounded-2xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-[#245b86] dark:text-sky-300">
                          {HUB_META[row.hubId]?.shortLabel || row.hubId}
                        </span>
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100">
                          {row.viTitle}
                        </span>
                        {row.enTitle && row.enTitle !== row.viTitle && (
                          <span className="text-[11px] text-muted-foreground">
                            ({row.enTitle})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {row.badges.map((b) => (
                          <span
                            key={b}
                            title={BADGE_CONFIG[b].title}
                            className={`inline-flex items-center rounded-2xs border px-1.5 py-0.2 text-[10px] font-bold ${BADGE_CONFIG[b].className}`}
                          >
                            {BADGE_CONFIG[b].label}
                          </span>
                        ))}
                        {row.schools.length > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            Trường:{' '}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {row.schools.slice(0, 5).join(', ')}
                              {row.schools.length > 5
                                ? ` +${row.schools.length - 5}`
                                : ''}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 text-[11px] shrink-0">
                      <div className="text-left md:text-right tabular-nums">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {row.totalCount} đề • {row.schoolCount} trường
                        </div>
                        <div className="text-muted-foreground">
                          {report.baselineLabel}: {row.baselineCount} ({row.baselineShare}%) → {report.latestBatch}:{' '}
                          <strong className="text-foreground">
                            {row.latestCount} ({row.latestShare}%)
                          </strong>
                        </div>
                      </div>

                      <div className="w-16 text-right tabular-nums">
                        <div className={deltaToneClass(row.deltaPp)}>
                          {formatDeltaPp(row.deltaPp)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {row.recent14dCount > 0
                            ? `14d: ${row.recent14dCount}`
                            : row.latestDate
                            ? formatShortDate(row.latestDate)
                            : 'Chưa gắn ngày'}
                        </div>
                      </div>

                      <span className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Drawer đối soát đề gốc */}
                  {isExpanded && (
                    <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-3 py-2.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Danh sách đề thực tế đối chiếu ({row.exams.length} đề):
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToSubtopic(row.hubId, row.subtopicId);
                          }}
                          className="inline-flex items-center gap-1 rounded-xs bg-[#245b86] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#1d4b6e] transition cursor-pointer"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Mở nhánh Mindmap
                        </button>
                      </div>

                      {row.exams.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Chưa có đề nào khớp với bộ lọc hiện tại.
                        </p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/70 rounded-xs border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                          {row.exams.map((exam) => (
                            <div
                              key={exam.id}
                              className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 text-xs"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                {exam.isNew && (
                                  <span className="rounded-2xs bg-rose-600 px-1 py-0.2 text-[9px] font-black text-white uppercase">
                                    NEW
                                  </span>
                                )}
                                <span className="rounded-2xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold text-[#245b86] dark:text-sky-300 shrink-0">
                                  {formatPartLabel(exam)}
                                </span>
                                <span className="rounded-2xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                  {exam.school}
                                </span>
                                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                                  {exam.date
                                    ? formatFullDate(exam.date)
                                    : `Đợt ${exam.batch}`}
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {exam.title}
                                </span>
                              </div>
                              <Link
                                href={getPracticeHref(exam)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#245b86] dark:text-sky-400 hover:underline shrink-0"
                              >
                                Luyện đề
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. KHỐI C: CƠ CẤU DẠNG BÀI WRITING & MA TRẬN NHỊP XUẤT HIỆN THEO TUẦN */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Cột trái: Cơ cấu dạng bài Writing */}
        <div className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs space-y-3">
          <div className="border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#245b86] dark:text-sky-300 flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Cơ cấu Dạng bài Writing (từ metadata đề gốc)
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Task 2 thống kê trên {report.essayTypeLabeledTotal} đề đã gắn nhãn dạng luận
              {report.essayTypeUnlabeledTotal > 0
                ? ` (${report.essayTypeUnlabeledTotal} đề đợt 09/2026 chưa gắn nhãn, tách riêng không suy đoán).`
                : '.'}
            </p>
          </div>

          {/* Writing Task 2: 5 Essay Types */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Writing Task 2 • Đợt {report.latestBatch} (n = {report.essayTypeLatestLabeledTotal})
            </div>
            {report.essayTypeRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Không có dữ liệu dạng bài Writing Task 2 cho bộ lọc trường hiện tại.
              </p>
            ) : (
              report.essayTypeRows.map((et) => (
                <div key={et.type} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {et.type}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {et.latestShare}% ({et.latestCount})
                      </span>
                      <span className="text-muted-foreground">
                        | Nền: {et.baselineShare}% ({et.baselineCount})
                      </span>
                      <span className={deltaToneClass(et.deltaPp)}>
                        {formatDeltaPp(et.deltaPp)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-2xs bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-2xs bg-[#245b86] dark:bg-sky-500"
                      style={{
                        width: `${Math.max(et.latestCount > 0 ? 4 : 0, et.latestShare)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Writing Task 1: Informal vs Formal & 6 Categories */}
          <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Writing Task 1 • Phong cách & 6 Nhóm Thư (n = {report.letterSummary.totalCount})
              </span>
              {!isLetterMode && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      skill: 'writing-task1',
                      hubFilter: 'all',
                    }))
                  }
                  className="text-[11px] font-bold text-[#245b86] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Xem riêng Task 1 →
                </button>
              )}
            </div>

            {report.letterSummary.informalCount + report.letterSummary.formalCount >
              0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Informal: {report.letterSummary.informalCount} (
                    {Math.round(
                      (report.letterSummary.informalCount /
                        (report.letterSummary.informalCount +
                          report.letterSummary.formalCount)) *
                        100
                    )}
                    %)
                  </span>
                  <span className="font-semibold text-[#245b86] dark:text-sky-400">
                    Formal: {report.letterSummary.formalCount} (
                    {Math.round(
                      (report.letterSummary.formalCount /
                        (report.letterSummary.informalCount +
                          report.letterSummary.formalCount)) *
                        100
                    )}
                    %)
                  </span>
                </div>
                <div className="flex h-2.5 rounded-2xs overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500"
                    style={{
                      width: `${
                        (report.letterSummary.informalCount /
                          (report.letterSummary.informalCount +
                            report.letterSummary.formalCount)) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-[#245b86] dark:bg-sky-500"
                    style={{
                      width: `${
                        (report.letterSummary.formalCount /
                          (report.letterSummary.informalCount +
                            report.letterSummary.formalCount)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                {report.letterSummary.unlabeledCount > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {report.letterSummary.unlabeledCount} đề đợt 09/2026 chưa gắn nhãn Informal/Formal.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {report.letterSummary.byCategory.map((cat) => (
                <div
                  key={cat.subtopicId}
                  className="rounded-xs border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-2 py-1.5 text-[11px]"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {cat.viTitle.replace(/^Thư\s+/i, '')}
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    {cat.totalCount} đề ({report.latestBatch}:{' '}
                    <strong className="text-foreground">{cat.latestCount}</strong>)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Ma trận nhịp xuất hiện theo Tuần thi thực tế */}
        <div className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs space-y-3">
          <div className="border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#245b86] dark:text-sky-300 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Nhịp xuất hiện theo Tuần thi thực tế (Tỷ trọng trong tuần)
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Chỉ tính trên các đề có ngày thi cụ thể (DD/MM/YYYY). Độ đậm của ô biểu thị tỷ trọng phần trăm trong từng tuần nhằm loại trừ sai lệch tổng số ca thi.
            </p>
          </div>

          {report.weeklyMatrix.length === 0 ? (
            <div className="rounded-xs border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-xs text-muted-foreground">
              Không có đề gắn ngày thi cụ thể trong bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="py-1.5 pr-2 text-left font-bold text-slate-600 dark:text-slate-300">
                      {isLetterMode ? 'Dạng thư' : 'Topic Hub'}
                    </th>
                    {report.weeklyMatrix.map((col) => (
                      <th
                        key={col.weekKey}
                        className="px-1 py-1.5 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                      >
                        <div>{col.label}</div>
                        <div className="text-[10px] font-normal text-muted-foreground">
                          n={col.totalDated}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-1 pr-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {row.label}
                      </td>
                      {report.weeklyMatrix.map((col) => {
                        const cell = col.cells[row.id] || {
                          count: 0,
                          share: 0,
                        };
                        return (
                          <td key={col.weekKey} className="p-1">
                            <div
                              title={`${row.label} • Tuần ${col.label}: ${cell.count}/${col.totalDated} đề (${cell.share}%)`}
                              className={`rounded-2xs border px-1.5 py-1.5 text-center tabular-nums leading-tight ${heatmapCellStyle(
                                cell.share,
                                cell.count
                              )}`}
                            >
                              <div>{cell.count}</div>
                              <div className="text-[9px] opacity-85">
                                {cell.count > 0 ? `${cell.share}%` : '–'}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-muted-foreground">
            <span>Thang độ đậm theo tỷ trọng tuần:</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-2xs border border-slate-200 bg-sky-50/70 dark:bg-slate-900 dark:border-slate-700" />
              &lt;10%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-2xs bg-sky-100 border border-sky-200 dark:bg-sky-950" />
              10–19%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-2xs bg-[#245b86]/75 dark:bg-sky-700" />
              20–34%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-2xs bg-[#245b86] dark:bg-sky-600" />
              ≥35%
            </span>
          </div>
        </div>
      </section>

      {/* 6. KHỐI D: MỤC TÁCH RIÊNG — ĐỀ MỚI / CHỦ ĐỀ CHƯA GOM NHÁNH MINDMAP */}
      <section
        id="unclassified-section"
        className="scroll-mt-14 rounded-sm border border-amber-300/80 dark:border-amber-800/80 bg-white dark:bg-slate-900 p-3.5 shadow-xs space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-amber-200/80 dark:border-amber-900/60 pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Mục tách riêng: Đề mới & Chủ đề chưa gom nhánh Mindmap (
              {report.unclassifiedExams.length} đề)
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Các đề dưới đây chưa khớp trực tiếp vào 57 chủ đề con hoặc 6 dạng thư hiện có nên được tách biệt hoàn toàn khỏi 5 Topic Hubs, giúp giữ đúng tỷ trọng từng Hub và phát hiện các chủ đề lẻ mới xuất hiện cần bổ sung vào Mindmap.
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(
              [
                { id: 'all', label: `Tất cả (${report.unclassifiedExams.length})` },
                {
                  id: 'latest',
                  label: `Đợt ${report.latestBatch} (${
                    report.unclassifiedExams.filter(
                      (e) => e.batch === report.latestBatch
                    ).length
                  })`,
                },
                {
                  id: 'new',
                  label: `Gắn cờ NEW (${
                    report.unclassifiedExams.filter((e) => e.isNew).length
                  })`,
                },
              ] as { id: UnclassifiedScope; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setUnclassifiedScope(opt.id)}
                className={`h-7 rounded-xs px-2 text-[11px] font-bold transition cursor-pointer ${
                  unclassifiedScope === opt.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filteredUnclassified.length === 0 ? (
          <div className="rounded-xs border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center text-xs text-muted-foreground">
            Không có đề chưa gom nhánh trong phạm vi đang chọn.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredUnclassified.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between gap-2 rounded-xs border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 px-2.5 py-2 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {exam.isNew && (
                      <span className="rounded-2xs bg-rose-600 px-1 py-0.2 text-[9px] font-black text-white uppercase">
                        NEW
                      </span>
                    )}
                    <span className="rounded-2xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-[#245b86] dark:text-sky-300">
                      {formatPartLabel(exam)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {exam.school}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {exam.date ? formatFullDate(exam.date) : `Đợt ${exam.batch}`}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {exam.title}
                  </div>
                </div>
                <Link
                  href={getPracticeHref(exam)}
                  className="inline-flex items-center gap-1 rounded-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-bold text-[#245b86] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 shrink-0"
                >
                  Luyện
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. KHỐI E: PHƯƠNG PHÁP TÍNH & GIỚI HẠN DỮ LIỆU (THU GỌN) */}
      <section className="rounded-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMethodology((v) => !v)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#245b86] dark:text-sky-400" />
            Phương pháp tính toán & Giới hạn tập dữ liệu
          </span>
          {showMethodology ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showMethodology && (
          <div className="border-t border-slate-200/80 dark:border-slate-800 px-3.5 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
            <p>
              Toàn bộ chỉ số trên trang được tính trực tiếp từ
              <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[11px]">
                bộ đề hiện tại
              </code>{' '}
              và đối chiếu quy tắc có trọng số (tiêu đề trọng số 4, mục đích hoặc nhóm đề trọng số 2,5, nội dung đề trọng số 1) vào 57 chủ đề con cùng 6 dạng thư của Mindmap. Các đề không đạt ngưỡng khớp được giữ tách biệt ở mục riêng thay vì gán mặc định vào nhóm Xã hội, nhờ đó tỷ trọng các Topic Hub không bị sai lệch.
            </p>
            <p>
              Do tổng cỡ mẫu giữa các đợt chênh lệch rõ rệt (đợt 09/2026 gồm 154 đề tổng hợp riêng của VLU không có ngày thi, đợt 10/2026 gồm 116 đề từ 7 trường và đợt 11/2026 gồm 336 đề từ 11 trường), phép đo xu hướng dùng tỷ trọng phần trăm trong từng đợt và biến thiên điểm phần trăm (Δ pp) thay cho số đếm tuyệt đối. Cửa sổ 14 ngày gần đây luôn neo theo ngày thi cuối cùng ghi nhận trong dữ liệu nhằm tránh khoảng trống thời gian.
            </p>
            <p>
              Các nhãn trạng thái áp dụng ngưỡng cố định để hạn chế nhiễu từ đề xuất hiện đơn lẻ: <strong>Mới xuất hiện</strong> yêu cầu tối thiểu 2 lượt hoặc 2 trường ở đợt hiện tại và bằng 0 ở kỳ nền; <strong>Tăng tỷ trọng</strong> yêu cầu tối thiểu 3 lượt, biến thiên từ +1,0 pp trở lên và tỷ trọng tương đối tăng tối thiểu 25%; <strong>Liên trường</strong> đánh dấu các chủ đề xuất hiện đồng thời từ 3 hội đồng thi trở lên. Kết quả phản ánh dữ liệu thực tế đã thu thập trong kho đề và không đóng vai trò dự báo xác suất ra đề.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

