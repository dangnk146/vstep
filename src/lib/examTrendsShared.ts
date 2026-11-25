export type TrendSkillFilter =
  | 'all'
  | 'speaking'
  | 'speaking-part1'
  | 'speaking-part2'
  | 'speaking-part3'
  | 'writing-task1'
  | 'writing-task2';

export type TrendBadgeType = 'emerging' | 'rising' | 'multi-school' | 'steady';

export interface ClassifiedExamRecord {
  id: string;
  title: string;
  school: string;
  batch: string;
  /** Exact exam date YYYY-MM-DD extracted from group field, if present */
  date: string | null;
  skill: 'speaking' | 'writing';
  /** Normalized part: part1 | part2 | part3 for speaking; part1 | part2 for writing */
  part: string;
  /** Topic Hub id ('work' | 'education' | 'health' | 'technology' | 'society' | 'letters') or null if unclassified */
  hubId: string | null;
  /** Mindmap subtopic id or null if unclassified */
  subtopicId: string | null;
  essayType: string | null;
  letterType: string | null;
  isNew: boolean;
  addedAt: string | null;
}

export interface SubtopicDescriptor {
  id: string;
  hubId: string;
  hubTitle: string;
  title: string;
  viTitle: string;
  enTitle: string;
}

export interface TrendDatasetResponse {
  ok: boolean;
  generatedAt: string;
  batches: string[];
  schools: string[];
  latestExamDate: string | null;
  recentWindowStart: string | null;
  subtopics: SubtopicDescriptor[];
  records: ClassifiedExamRecord[];
}

export interface TrendFilterState {
  skill: TrendSkillFilter;
  /** 'all' | 'non-vlu' | specific school code */
  school: string;
  includeSeptBaseline: boolean;
  hubFilter: string; // 'all' or specific hubId
}

export interface HubTrendRow {
  hubId: string;
  title: string;
  vietnameseTitle: string;
  totalCount: number;
  totalShare: number;
  baselineCount: number;
  baselineShare: number;
  latestCount: number;
  latestShare: number;
  deltaPp: number;
  schoolCount: number;
  schools: string[];
  recent14dCount: number;
}

export interface SubtopicTrendRow {
  subtopicId: string;
  hubId: string;
  hubTitle: string;
  title: string;
  viTitle: string;
  enTitle: string;
  totalCount: number;
  baselineCount: number;
  baselineShare: number;
  latestCount: number;
  latestShare: number;
  deltaPp: number;
  schools: string[];
  schoolCount: number;
  recent14dCount: number;
  latestDate: string | null;
  batchesPresent: string[];
  badges: TrendBadgeType[];
  exams: ClassifiedExamRecord[];
}

export interface EssayTypeRow {
  type: string;
  totalCount: number;
  latestCount: number;
  baselineCount: number;
  latestShare: number;
  baselineShare: number;
  deltaPp: number;
}

export interface LetterFormatSummary {
  informalCount: number;
  formalCount: number;
  unlabeledCount: number;
  totalCount: number;
  byCategory: SubtopicTrendRow[];
}

export interface WeeklyHubCell {
  hubId: string;
  count: number;
  share: number;
}

export interface WeeklyMatrixColumn {
  weekKey: string;
  label: string;
  startDate: string;
  endDate: string;
  totalDated: number;
  cells: Record<string, WeeklyHubCell>;
}

export interface TrendReport {
  totalRecords: number;
  thematicTotal: number;
  thematicClassified: number;
  thematicUnclassified: number;
  thematicCoveragePct: number;
  letterTotal: number;
  letterClassified: number;
  letterUnclassified: number;
  letterCoveragePct: number;
  overallClassified: number;
  overallUnclassified: number;
  overallCoveragePct: number;
  datedCount: number;
  recent14dCount: number;
  latestExamDate: string | null;
  recentWindowStart: string | null;
  activeSchools: string[];
  vluCount: number;
  vluSharePct: number;
  latestBatch: string;
  baselineLabel: string;
  latestBatchTotal: number;
  baselineTotal: number;
  latestBatchThematicTotal: number;
  baselineThematicTotal: number;
  emergingCount: number;
  risingCount: number;
  multiSchoolCount: number;
  hubRows: HubTrendRow[];
  subtopicRows: SubtopicTrendRow[];
  subtopicMap: Record<string, SubtopicTrendRow>;
  essayTypeRows: EssayTypeRow[];
  essayTypeLabeledTotal: number;
  essayTypeUnlabeledTotal: number;
  essayTypeLatestLabeledTotal: number;
  letterSummary: LetterFormatSummary;
  weeklyMatrix: WeeklyMatrixColumn[];
  unclassifiedExams: ClassifiedExamRecord[];
}

export const HUB_META: Record<
  string,
  { title: string; vietnameseTitle: string; shortLabel: string; color: string }
> = {
  work: {
    title: 'Work & Career',
    vietnameseTitle: 'Công việc, Sự nghiệp & Kỹ năng',
    shortLabel: 'Work',
    color: '#0284c7',
  },
  education: {
    title: 'Education & Learning',
    vietnameseTitle: 'Giáo dục, Campus & Học tập',
    shortLabel: 'Education',
    color: '#7c3aed',
  },
  health: {
    title: 'Health & Lifestyle',
    vietnameseTitle: 'Sức khỏe, Thói quen & Lối sống',
    shortLabel: 'Health',
    color: '#059669',
  },
  technology: {
    title: 'Technology & AI',
    vietnameseTitle: 'Công nghệ, Mạng xã hội & AI',
    shortLabel: 'Tech & AI',
    color: '#d97706',
  },
  society: {
    title: 'Society & Environment',
    vietnameseTitle: 'Xã hội, Đời sống & Môi trường',
    shortLabel: 'Society',
    color: '#0f766e',
  },
  letters: {
    title: 'Writing Task 1 Letters',
    vietnameseTitle: 'Writing Task 1: 6 Dạng Thư',
    shortLabel: 'Letters',
    color: '#245b86',
  },
};

export const THEMATIC_HUB_IDS = ['work', 'education', 'health', 'technology', 'society'] as const;

/** Convert MM/YYYY batch string to sortable YYYYMM integer */
export function batchToSortKey(batch: string): number {
  const m = batch.match(/^(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  return Number(m[2]) * 100 + Number(m[1]);
}

export function sortBatchesChronologically(batches: string[]): string[] {
  return [...batches].sort((a, b) => batchToSortKey(a) - batchToSortKey(b));
}

export function formatShortDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${m[3]}/${m[2]}`;
}

export function formatFullDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Shift an ISO YYYY-MM-DD date string by deltaDays (UTC safe) */
export function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Get ISO Monday date string for a given YYYY-MM-DD date */
function getWeekMonday(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return shiftIsoDate(isoDate, diffToMonday);
}

export function matchesSkillFilter(
  rec: ClassifiedExamRecord,
  skill: TrendSkillFilter
): boolean {
  switch (skill) {
    case 'all':
      return true;
    case 'speaking':
      return rec.skill === 'speaking';
    case 'speaking-part1':
      return rec.skill === 'speaking' && rec.part === 'part1';
    case 'speaking-part2':
      return rec.skill === 'speaking' && rec.part === 'part2';
    case 'speaking-part3':
      return rec.skill === 'speaking' && rec.part === 'part3';
    case 'writing-task1':
      return rec.skill === 'writing' && rec.part === 'part1';
    case 'writing-task2':
      return rec.skill === 'writing' && rec.part === 'part2';
    default:
      return true;
  }
}

export function matchesSchoolFilter(
  rec: ClassifiedExamRecord,
  schoolFilter: string
): boolean {
  if (!schoolFilter || schoolFilter === 'all') return true;
  if (schoolFilter === 'non-vlu') return rec.school.toUpperCase() !== 'VLU';
  return rec.school.toUpperCase() === schoolFilter.toUpperCase();
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return round1((part / total) * 100);
}

function sortExamsNewestFirst(a: ClassifiedExamRecord, b: ClassifiedExamRecord): number {
  const dateA = a.date || '';
  const dateB = b.date || '';
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  const batchDiff = batchToSortKey(b.batch) - batchToSortKey(a.batch);
  if (batchDiff !== 0) return batchDiff;
  if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
  return a.id.localeCompare(b.id);
}

function computeBadges(params: {
  latestCount: number;
  baselineCount: number;
  latestShare: number;
  baselineShare: number;
  deltaPp: number;
  schoolCount: number;
  batchesPresentCount: number;
}): TrendBadgeType[] {
  const badges: TrendBadgeType[] = [];
  const {
    latestCount,
    baselineCount,
    latestShare,
    baselineShare,
    deltaPp,
    schoolCount,
    batchesPresentCount,
  } = params;

  // Emerging: appeared in latest batch >= 2 times (or >= 2 schools) and 0 times in baseline
  if (baselineCount === 0 && (latestCount >= 2 || schoolCount >= 2)) {
    badges.push('emerging');
  } else if (
    baselineCount > 0 &&
    latestCount >= 3 &&
    deltaPp >= 1.0 &&
    (baselineShare <= 0 || latestShare / baselineShare >= 1.25)
  ) {
    badges.push('rising');
  }

  if (schoolCount >= 3) {
    badges.push('multi-school');
  }

  if (
    batchesPresentCount >= 2 &&
    !badges.includes('rising') &&
    !badges.includes('emerging') &&
    Math.abs(deltaPp) < 1.0 &&
    latestCount >= 2
  ) {
    badges.push('steady');
  }

  return badges;
}

export function computeTrendReport(
  allRecords: ClassifiedExamRecord[],
  subtopics: SubtopicDescriptor[],
  batchesRaw: string[],
  globalLatestExamDate: string | null,
  filters: TrendFilterState
): TrendReport {
  const sortedBatches = sortBatchesChronologically(batchesRaw);
  const latestBatch = sortedBatches[sortedBatches.length - 1] || '11/2026';
  const prevBatch =
    sortedBatches.length >= 2 ? sortedBatches[sortedBatches.length - 2] : '10/2026';
  const baselineBatches = filters.includeSeptBaseline
    ? sortedBatches.slice(0, -1)
    : [prevBatch];
  const baselineSet = new Set(baselineBatches);
  const baselineLabel = filters.includeSeptBaseline
    ? baselineBatches.join(' + ')
    : prevBatch;

  // Apply skill + school filters
  const filtered = allRecords.filter(
    (rec) =>
      matchesSkillFilter(rec, filters.skill) &&
      matchesSchoolFilter(rec, filters.school)
  );

  // Determine latest exam date in filtered set (fallback to global)
  let latestExamDate: string | null = null;
  for (const r of filtered) {
    if (r.date && (!latestExamDate || r.date > latestExamDate)) {
      latestExamDate = r.date;
    }
  }
  if (!latestExamDate) latestExamDate = globalLatestExamDate;
  const recentWindowStart = latestExamDate ? shiftIsoDate(latestExamDate, -13) : null;

  const isRecent14d = (rec: ClassifiedExamRecord) =>
    Boolean(rec.date && recentWindowStart && rec.date >= recentWindowStart);

  // Split thematic (Speaking + Writing Task 2) vs letters (Writing Task 1)
  const thematicRecords = filtered.filter(
    (r) => !(r.skill === 'writing' && r.part === 'part1')
  );
  const letterRecords = filtered.filter(
    (r) => r.skill === 'writing' && r.part === 'part1'
  );

  const thematicClassified = thematicRecords.filter((r) => Boolean(r.subtopicId)).length;
  const thematicUnclassified = thematicRecords.length - thematicClassified;
  const letterClassified = letterRecords.filter((r) => Boolean(r.subtopicId)).length;
  const letterUnclassified = letterRecords.length - letterClassified;

  const overallClassified = thematicClassified + letterClassified;
  const overallUnclassified = thematicUnclassified + letterUnclassified;

  const datedRecords = filtered.filter((r) => Boolean(r.date));
  const recent14dCount = filtered.filter(isRecent14d).length;

  const activeSchoolsSet = new Set<string>();
  let vluCount = 0;
  for (const r of filtered) {
    if (r.school) activeSchoolsSet.add(r.school);
    if (r.school.toUpperCase() === 'VLU') vluCount++;
  }
  const activeSchools = [...activeSchoolsSet].sort();

  const latestBatchTotal = filtered.filter((r) => r.batch === latestBatch).length;
  const baselineTotal = filtered.filter((r) => baselineSet.has(r.batch)).length;

  // Choose primary denominator pool for hub & subtopic shares
  const isLetterOnlyMode = filters.skill === 'writing-task1';
  const primaryRecords = isLetterOnlyMode ? letterRecords : thematicRecords;
  const latestBatchPrimaryTotal = primaryRecords.filter(
    (r) => r.batch === latestBatch
  ).length;
  const baselinePrimaryTotal = primaryRecords.filter((r) =>
    baselineSet.has(r.batch)
  ).length;

  // Build subtopic rows for ALL 63 subtopics (so both OutlineDocumentView and TrendsView can look up any subtopicId)
  const examsBySubtopic = new Map<string, ClassifiedExamRecord[]>();
  for (const r of filtered) {
    if (!r.subtopicId) continue;
    const arr = examsBySubtopic.get(r.subtopicId) || [];
    arr.push(r);
    examsBySubtopic.set(r.subtopicId, arr);
  }

  const letterLatestTotal = letterRecords.filter((r) => r.batch === latestBatch).length;
  const letterBaselineTotal = letterRecords.filter((r) =>
    baselineSet.has(r.batch)
  ).length;

  const thematicLatestTotal = thematicRecords.filter(
    (r) => r.batch === latestBatch
  ).length;
  const thematicBaselineTotal = thematicRecords.filter((r) =>
    baselineSet.has(r.batch)
  ).length;

  const allSubtopicRows: SubtopicTrendRow[] = subtopics.map((desc) => {
    const matched = (examsBySubtopic.get(desc.id) || []).sort(sortExamsNewestFirst);
    const isLetter = desc.hubId === 'letters';
    const denomLatest = isLetter ? letterLatestTotal : thematicLatestTotal;
    const denomBaseline = isLetter ? letterBaselineTotal : thematicBaselineTotal;

    const latestCount = matched.filter((r) => r.batch === latestBatch).length;
    const baselineCount = matched.filter((r) => baselineSet.has(r.batch)).length;
    const latestShare = pct(latestCount, denomLatest);
    const baselineShare = pct(baselineCount, denomBaseline);
    const deltaPp = round1(latestShare - baselineShare);

    const schools = [...new Set(matched.map((r) => r.school).filter(Boolean))].sort();
    const batchesPresent = sortBatchesChronologically([
      ...new Set(matched.map((r) => r.batch).filter(Boolean)),
    ]);
    const recentCount = matched.filter(isRecent14d).length;
    const latestDate = matched.find((r) => r.date)?.date || null;

    const badges = computeBadges({
      latestCount,
      baselineCount,
      latestShare,
      baselineShare,
      deltaPp,
      schoolCount: schools.length,
      batchesPresentCount: batchesPresent.length,
    });

    return {
      subtopicId: desc.id,
      hubId: desc.hubId,
      hubTitle: desc.hubTitle,
      title: desc.title,
      viTitle: desc.viTitle,
      enTitle: desc.enTitle,
      totalCount: matched.length,
      baselineCount,
      baselineShare,
      latestCount,
      latestShare,
      deltaPp,
      schools,
      schoolCount: schools.length,
      recent14dCount: recentCount,
      latestDate,
      batchesPresent,
      badges,
      exams: matched,
    };
  });

  const subtopicMap: Record<string, SubtopicTrendRow> = {};
  for (const row of allSubtopicRows) {
    subtopicMap[row.subtopicId] = row;
  }

  // Primary subtopic rows for main ranking table (respecting skill mode and hubFilter)
  const subtopicRows = allSubtopicRows.filter((row) => {
    if (isLetterOnlyMode) return row.hubId === 'letters';
    if (row.hubId === 'letters') return false;
    if (filters.hubFilter !== 'all' && row.hubId !== filters.hubFilter) return false;
    return true;
  });

  // Hub-level summary rows (for 5 Topic Hubs, or 6 Letter Types when in writing-task1 mode)
  const hubRows: HubTrendRow[] = isLetterOnlyMode
    ? allSubtopicRows
        .filter((r) => r.hubId === 'letters')
        .map((r) => ({
          hubId: r.subtopicId,
          title: r.enTitle || r.title,
          vietnameseTitle: r.viTitle || r.title,
          totalCount: r.totalCount,
          totalShare: pct(r.totalCount, letterRecords.length),
          baselineCount: r.baselineCount,
          baselineShare: r.baselineShare,
          latestCount: r.latestCount,
          latestShare: r.latestShare,
          deltaPp: r.deltaPp,
          schoolCount: r.schoolCount,
          schools: r.schools,
          recent14dCount: r.recent14dCount,
        }))
        .sort((a, b) => b.latestShare - a.latestShare || b.totalCount - a.totalCount)
    : THEMATIC_HUB_IDS.map((hubId) => {
        const matched = thematicRecords.filter((r) => r.hubId === hubId);
        const latestCount = matched.filter((r) => r.batch === latestBatch).length;
        const baselineCount = matched.filter((r) => baselineSet.has(r.batch)).length;
        const latestShare = pct(latestCount, thematicLatestTotal);
        const baselineShare = pct(baselineCount, thematicBaselineTotal);
        const schools = [...new Set(matched.map((r) => r.school).filter(Boolean))].sort();
        const meta = HUB_META[hubId];
        return {
          hubId,
          title: meta.title,
          vietnameseTitle: meta.vietnameseTitle,
          totalCount: matched.length,
          totalShare: pct(matched.length, thematicRecords.length),
          baselineCount,
          baselineShare,
          latestCount,
          latestShare,
          deltaPp: round1(latestShare - baselineShare),
          schoolCount: schools.length,
          schools,
          recent14dCount: matched.filter(isRecent14d).length,
        };
      }).sort((a, b) => b.latestShare - a.latestShare || b.totalCount - a.totalCount);

  // Writing Task 2 Essay Types (computed on Writing Task 2 records within current school filter)
  const writingT2Pool = allRecords.filter(
    (r) =>
      r.skill === 'writing' &&
      r.part === 'part2' &&
      matchesSchoolFilter(r, filters.school)
  );
  const labeledT2 = writingT2Pool.filter((r) => Boolean(r.essayType));
  const unlabeledT2Count = writingT2Pool.length - labeledT2.length;
  const labeledT2Latest = labeledT2.filter((r) => r.batch === latestBatch);
  const labeledT2Baseline = labeledT2.filter((r) => baselineSet.has(r.batch));

  const essayTypeNames = [
    ...new Set(labeledT2.map((r) => r.essayType as string)),
  ];
  const essayTypeRows: EssayTypeRow[] = essayTypeNames
    .map((type) => {
      const totalCount = labeledT2.filter((r) => r.essayType === type).length;
      const latestCount = labeledT2Latest.filter((r) => r.essayType === type).length;
      const baselineCount = labeledT2Baseline.filter((r) => r.essayType === type).length;
      const latestShare = pct(latestCount, labeledT2Latest.length);
      const baselineShare = pct(baselineCount, labeledT2Baseline.length);
      return {
        type,
        totalCount,
        latestCount,
        baselineCount,
        latestShare,
        baselineShare,
        deltaPp: round1(latestShare - baselineShare),
      };
    })
    .sort((a, b) => b.latestCount - a.latestCount || b.totalCount - a.totalCount);

  // Writing Task 1 Letter summary (always available within current school filter)
  const writingT1Pool = allRecords.filter(
    (r) =>
      r.skill === 'writing' &&
      r.part === 'part1' &&
      matchesSchoolFilter(r, filters.school)
  );
  let informalCount = 0;
  let formalCount = 0;
  let unlabeledLetterCount = 0;
  for (const r of writingT1Pool) {
    const lt = (r.letterType || '').toLowerCase();
    if (lt.includes('informal')) informalCount++;
    else if (lt.includes('formal')) formalCount++;
    else unlabeledLetterCount++;
  }
  const letterCategoryRows = allSubtopicRows
    .filter((r) => r.hubId === 'letters')
    .sort((a, b) => b.latestCount - a.latestCount || b.totalCount - a.totalCount);

  // Weekly matrix on dated thematic records (or letter records if in writing-task1 mode)
  const datedPrimary = primaryRecords.filter((r) => Boolean(r.date));
  const weekBuckets = new Map<
    string,
    {
      startDate: string;
      endDate: string;
      records: ClassifiedExamRecord[];
    }
  >();

  for (const r of datedPrimary) {
    if (!r.date) continue;
    const monday = getWeekMonday(r.date);
    const sunday = shiftIsoDate(monday, 6);
    const existing = weekBuckets.get(monday);
    if (existing) {
      existing.records.push(r);
    } else {
      weekBuckets.set(monday, {
        startDate: monday,
        endDate: sunday,
        records: [r],
      });
    }
  }

  const rowIdsForMatrix = isLetterOnlyMode
    ? allSubtopicRows.filter((r) => r.hubId === 'letters').map((r) => r.subtopicId)
    : [...THEMATIC_HUB_IDS];

  const weeklyMatrix: WeeklyMatrixColumn[] = [...weekBuckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekKey, bucket]) => {
      const cells: Record<string, WeeklyHubCell> = {};
      for (const id of rowIdsForMatrix) {
        const count = bucket.records.filter((r) =>
          isLetterOnlyMode ? r.subtopicId === id : r.hubId === id
        ).length;
        cells[id] = {
          hubId: id,
          count,
          share: pct(count, bucket.records.length),
        };
      }
      return {
        weekKey,
        label: `${formatShortDate(bucket.startDate)}–${formatShortDate(bucket.endDate)}`,
        startDate: bucket.startDate,
        endDate: bucket.endDate,
        totalDated: bucket.records.length,
        cells,
      };
    });

  // Unclassified exams (completely separated from the 5 Topic Hubs)
  const unclassifiedExams = filtered
    .filter((r) => !r.subtopicId)
    .sort(sortExamsNewestFirst);

  const emergingCount = subtopicRows.filter((r) =>
    r.badges.includes('emerging')
  ).length;
  const risingCount = subtopicRows.filter((r) => r.badges.includes('rising')).length;
  const multiSchoolCount = subtopicRows.filter((r) =>
    r.badges.includes('multi-school')
  ).length;

  return {
    totalRecords: filtered.length,
    thematicTotal: thematicRecords.length,
    thematicClassified,
    thematicUnclassified,
    thematicCoveragePct: pct(thematicClassified, thematicRecords.length),
    letterTotal: letterRecords.length,
    letterClassified,
    letterUnclassified,
    letterCoveragePct: pct(letterClassified, letterRecords.length),
    overallClassified,
    overallUnclassified,
    overallCoveragePct: pct(overallClassified, filtered.length),
    datedCount: datedRecords.length,
    recent14dCount,
    latestExamDate,
    recentWindowStart,
    activeSchools,
    vluCount,
    vluSharePct: pct(vluCount, filtered.length),
    latestBatch,
    baselineLabel,
    latestBatchTotal,
    baselineTotal,
    latestBatchThematicTotal: latestBatchPrimaryTotal,
    baselineThematicTotal: baselinePrimaryTotal,
    emergingCount,
    risingCount,
    multiSchoolCount,
    hubRows,
    subtopicRows,
    subtopicMap,
    essayTypeRows,
    essayTypeLabeledTotal: labeledT2.length,
    essayTypeUnlabeledTotal: unlabeledT2Count,
    essayTypeLatestLabeledTotal: labeledT2Latest.length,
    letterSummary: {
      informalCount,
      formalCount,
      unlabeledCount: unlabeledLetterCount,
      totalCount: writingT1Pool.length,
      byCategory: letterCategoryRows,
    },
    weeklyMatrix,
    unclassifiedExams,
  };
}

