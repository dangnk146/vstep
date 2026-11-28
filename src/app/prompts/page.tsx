'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import {
  getExamCategory,
  toPromptEditorHtml,
  toReadablePromptText,
  type ExamPrompt,
} from '@/utils/examPrompts';
import {
  buildPromptsUrlQuery,
  downloadMarkdownFile,
  filterExamPrompts,
  generatePromptsMarkdown,
  parsePromptsUrlQuery,
} from './utils';
import {
  fetchExamFilterOptions,
  fetchExamPrompts,
  getExamApiSettings,
  getExamApiSettingsSnapshot,
  getServerExamApiSettingsSnapshot,
  parseExamApiSettingsSnapshot,
  saveExamApiSettings,
  subscribeToExamApiSettings,
} from '@/lib/examApi';
import type { SkillFilter, PartFilter, ExportConfig, PromptSortMode } from './types';
import { PromptHeader } from './components/PromptHeader';
import { PromptSidebar } from './components/PromptSidebar';
import { PromptDetailCard } from './components/PromptDetailCard';
import { PromptList } from './components/PromptList';
import { PromptExportModal } from './components/PromptExportModal';

export default function PromptBankPage() {
  const settingsSnapshot = useSyncExternalStore(
    subscribeToExamApiSettings,
    getExamApiSettingsSnapshot,
    getServerExamApiSettingsSnapshot,
  );
  const settings = parseExamApiSettingsSnapshot(settingsSnapshot);

  // All prompts loaded in memory for zero-latency filtering & exporting
  const [allPrompts, setAllPrompts] = useState<ExamPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Available metadata from backend
  const [availableSchools, setAvailableSchools] = useState<string[]>([]);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);

  // Page filters (school & batch come directly from global exam settings so there is a single source of truth)
  const [selectedSkill, setSelectedSkill] = useState<SkillFilter>('all');
  const [selectedPart, setSelectedPart] = useState<PartFilter>('all');
  const selectedSchool = settings.school || 'all';
  const selectedBatch = settings.batch || 'all';
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [sortMode, setSortMode] = useState<PromptSortMode>('newest');

  // Active prompt drawer
  const [selectedPrompt, setSelectedPrompt] = useState<ExamPrompt | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const promptPanelRef = useRef<HTMLDivElement>(null);

  // Synchronization state/refs
  const [isUrlSynced, setIsUrlSynced] = useState(false);
  const initialExamIdRef = useRef<string | null>(null);

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [customExportConfig, setCustomExportConfig] = useState<Partial<ExportConfig>>({});

  // Debounce search state for URL sync to avoid spamming replaceState
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. Sync filters from URL on mount & back/forward navigation
  useEffect(() => {
    const syncFromLocation = () => {
      const parsed = parsePromptsUrlQuery(window.location.search);
      const hasScopeInUrl = parsed.school !== undefined || parsed.batch !== undefined;

      // Only /prompts URLs with explicit matruong/batch update global settings (for shared links);
      // URLs without matruong/batch preserve localStorage untouched.
      if (hasScopeInUrl) {
        const nextSchool = parsed.school && parsed.school !== 'all' ? parsed.school : '';
        const nextBatch = parsed.batch && parsed.batch !== 'all' ? parsed.batch : '';
        const current = getExamApiSettings();
        if (nextSchool !== current.school || nextBatch !== current.batch) {
          saveExamApiSettings({ school: nextSchool, batch: nextBatch });
        }
      }

      if (parsed.skill !== undefined) {
        setSelectedSkill(parsed.skill);
      }

      if (parsed.part !== undefined) {
        setSelectedPart(parsed.part);
      }

      if (parsed.search !== undefined) {
        setSearch(parsed.search);
        setDebouncedSearch(parsed.search);
      }

      if (parsed.onlyNew !== undefined) {
        setOnlyNew(parsed.onlyNew);
      }

      if (parsed.sort !== undefined) {
        setSortMode(parsed.sort);
      }

      if (parsed.examId) {
        initialExamIdRef.current = parsed.examId;
      }

      setIsUrlSynced(true);
    };

    syncFromLocation();

    const handlePopState = () => {
      syncFromLocation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 2. Auto-select exam prompt if exam was in URL
  useEffect(() => {
    if (allPrompts.length > 0 && initialExamIdRef.current) {
      const found = allPrompts.find((p) => p.id === initialExamIdRef.current);
      if (found) {
        setSelectedPrompt(found);
      }
      initialExamIdRef.current = null;
    }
  }, [allPrompts]);

  // 3. Immediately sync selection state to URL search parameters without navigating
  useEffect(() => {
    if (!isUrlSynced) return;

    const queryString = buildPromptsUrlQuery({
      school: selectedSchool,
      batch: selectedBatch,
      skill: selectedSkill,
      part: selectedPart,
      search: debouncedSearch,
      onlyNew,
      sort: sortMode,
      examId: selectedPrompt?.id,
    });

    const canonicalUrl = queryString ? `/prompts?${queryString}` : '/prompts';
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== canonicalUrl) {
      window.history.replaceState(null, '', canonicalUrl);
    }
  }, [isUrlSynced, selectedSkill, selectedPart, selectedSchool, selectedBatch, debouncedSearch, onlyNew, sortMode, selectedPrompt]);

  // Load all prompts and filter options on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      fetchExamPrompts(), // loads all data without server-side filtering
      fetchExamFilterOptions(),
    ])
      .then(([promptsData, manifestData]) => {
        if (cancelled) return;
        setAllPrompts(promptsData);
        setAvailableSchools(manifestData.schools || []);
        setAvailableBatches(manifestData.batches || []);
        setLoadError('');
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Không thể tải ngân hàng đề.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync settings when school/batch is changed
  const handleSchoolChange = (school: string) => {
    saveExamApiSettings({ school: school === 'all' ? '' : school });
  };

  const handleBatchChange = (batch: string) => {
    saveExamApiSettings({ batch: batch === 'all' ? '' : batch });
  };

  // Prompts matching scope before onlyNew filter (to display accurate NEW badge count)
  const scopedPrompts = useMemo(
    () =>
      filterExamPrompts(allPrompts, {
        skill: selectedSkill,
        part: selectedPart,
        school: selectedSchool,
        batch: selectedBatch,
        search,
        onlyNew: false,
        sort: sortMode,
      }),
    [allPrompts, selectedSkill, selectedPart, selectedSchool, selectedBatch, search, sortMode]
  );

  const newPromptsCount = useMemo(
    () => scopedPrompts.filter((p) => p.isNew).length,
    [scopedPrompts]
  );

  // Main filtered prompts for display (shared with standalone /dating app)
  const filteredPrompts = useMemo(
    () => (onlyNew ? scopedPrompts.filter((p) => p.isNew) : scopedPrompts),
    [scopedPrompts, onlyNew]
  );

  // Build URL for standalone /dating app carrying only local view filters (school & batch come from global settings)
  const datingHref = useMemo(() => {
    const queryString = buildPromptsUrlQuery({
      skill: selectedSkill,
      part: selectedPart,
      search,
      onlyNew,
      sort: sortMode,
    });
    return queryString ? `/dating?${queryString}` : '/dating';
  }, [selectedSkill, selectedPart, search, onlyNew, sortMode]);

  // Counts by category scoped to active School, Batch, Search & onlyNew filters
  const counts = useMemo(() => {
    const baseScoped = filterExamPrompts(allPrompts, {
      skill: 'all',
      part: 'all',
      school: selectedSchool,
      batch: selectedBatch,
      search,
      onlyNew,
      sort: 'default',
    });

    const res: Record<string, number> = {
      all: baseScoped.length,
      speaking: 0,
      writing: 0,
      'speaking-part1': 0,
      'speaking-part2': 0,
      'speaking-part3': 0,
      'writing-task1': 0,
      'writing-task2': 0,
    };
    baseScoped.forEach((p) => {
      if (p.category.startsWith('speaking-')) res.speaking++;
      if (p.category.startsWith('writing-')) res.writing++;
      if (res[p.category] !== undefined) res[p.category]++;
    });
    return res;
  }, [allPrompts, selectedSchool, selectedBatch, search, onlyNew]);

  // Select a prompt to view details
  const handleSelectPrompt = (prompt: ExamPrompt) => {
    setSelectedPrompt(prompt);
    window.requestAnimationFrame(() => {
      promptPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Pick random prompt from current filtered view
  const handleRandomPrompt = () => {
    const list = filteredPrompts.length > 0 ? filteredPrompts : allPrompts;
    if (list.length === 0) return;
    const random = list[Math.floor(Math.random() * list.length)];
    handleSelectPrompt(random);
  };

  // Copy individual prompt
  const handleCopyPrompt = async (prompt: ExamPrompt) => {
    try {
      const text = `${prompt.title}\n\n${toReadablePromptText(prompt.content)}`;
      await navigator.clipboard.writeText(text);
      setCopiedPromptId(prompt.id);
      setTimeout(() => setCopiedPromptId(null), 2500);
    } catch {
      alert('Không thể sao chép vào clipboard.');
    }
  };

  // Store for writing/speaking practice
  const handlePracticeWriting = (prompt: ExamPrompt) => {
    const task = prompt.category === 'writing-task1' ? 'task1' : 'task2';
    sessionStorage.setItem('vstep_bank_writing_prompt', JSON.stringify({
      id: prompt.id,
      title: prompt.title,
      content: toReadablePromptText(prompt.content),
      task,
    }));
  };

  const handlePracticeSpeaking = (prompt: ExamPrompt) => {
    localStorage.setItem('vstep_speaking_custom_exam_html', toPromptEditorHtml(prompt));
    localStorage.setItem('vstep_speaking_active_exam', prompt.id);
    const part = prompt.category.replace('speaking-', '');
    if (part === 'part1' || part === 'part2' || part === 'part3') {
      localStorage.setItem('vstep_speaking_active_part', part);
    }
  };

  // Direct download for currently filtered prompts (Purple button action)
  const handleDirectDownloadCurrent = () => {
    if (filteredPrompts.length === 0) {
      alert('Không có đề thi nào để xuất với bộ lọc hiện tại.');
      return;
    }

    setIsDownloading(true);

    let partLabel = 'Tất cả các phần thi';
    if (selectedSkill === 'speaking' && selectedPart === 'all') partLabel = 'Speaking (Toàn bộ Part 1, 2, 3)';
    else if (selectedSkill === 'writing' && selectedPart === 'all') partLabel = 'Writing (Toàn bộ Task 1, 2)';
    else if (selectedPart !== 'all') {
      const cat = getExamCategory(selectedPart);
      if (cat) partLabel = cat.label;
    }

    const schoolsLabel = selectedSchool !== 'all' ? selectedSchool : 'Tất cả các trường';
    const batchesLabel = selectedBatch !== 'all' ? `Đợt ${selectedBatch}` : 'Tất cả các đợt thi';

    const md = generatePromptsMarkdown(filteredPrompts, {
      categoryLabel: partLabel,
      schoolsLabel,
      batchesLabel,
      includeMetadata: true,
      numbering: true,
    });

    const catSlug = selectedPart !== 'all' ? selectedPart : selectedSkill !== 'all' ? `${selectedSkill}-all` : 'all-parts';
    const schoolSlug = selectedSchool !== 'all' ? selectedSchool : 'all-schools';
    const batchSlug = selectedBatch !== 'all' ? selectedBatch.replace(/[\/-]/g, '') : 'all-batches';
    const fileName = `VSTEP_${catSlug}_${schoolSlug}_${batchSlug}.md`;

    downloadMarkdownFile(fileName, md);

    setTimeout(() => {
      setIsDownloading(false);
    }, 600);
  };

  // Quick Copy all currently filtered prompts
  const handleCopyAll = async () => {
    if (filteredPrompts.length === 0) {
      alert('Không có đề thi nào để sao chép.');
      return;
    }

    let partLabel = 'Tất cả các phần thi';
    if (selectedSkill === 'speaking' && selectedPart === 'all') partLabel = 'Speaking (Toàn bộ Part 1, 2, 3)';
    else if (selectedSkill === 'writing' && selectedPart === 'all') partLabel = 'Writing (Toàn bộ Task 1, 2)';
    else if (selectedPart !== 'all') {
      const cat = getExamCategory(selectedPart);
      if (cat) partLabel = cat.label;
    }

    const schoolsLabel = selectedSchool !== 'all' ? selectedSchool : 'Tất cả các trường';
    const batchesLabel = selectedBatch !== 'all' ? `Đợt ${selectedBatch}` : 'Tất cả các đợt thi';

    const md = generatePromptsMarkdown(filteredPrompts, {
      categoryLabel: partLabel,
      schoolsLabel,
      batchesLabel,
      includeMetadata: true,
      numbering: true,
    });

    try {
      await navigator.clipboard.writeText(md);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      alert('Không thể sao chép vào clipboard.');
    }
  };

  // Open Export configured with current filters (Preview button)
  const handleOpenExportCurrent = () => {
    setCustomExportConfig({
      category: selectedPart !== 'all' ? selectedPart : selectedSkill === 'speaking' ? 'speaking-all' : selectedSkill === 'writing' ? 'writing-all' : 'all',
      schools: selectedSchool !== 'all' ? [selectedSchool] : [],
      batches: selectedBatch !== 'all' ? [selectedBatch] : [],
    });
    setIsExportOpen(true);
  };

  return (
    <div className="flex w-full max-w-full flex-col space-y-2.5 animate-fade-in pb-12 sm:pb-6 px-1.5 sm:px-3 lg:px-5">
      {/* 1. Header (Full Width & Synchronized with Speaking & Writing) */}
      <PromptHeader
        totalCount={allPrompts.length}
        filteredCount={filteredPrompts.length}
        datingHref={datingHref}
        isLoading={isLoading}
        selectedSchool={selectedSchool}
        selectedBatch={selectedBatch}
        onOpenExport={() => {
          setCustomExportConfig({});
          setIsExportOpen(true);
        }}
        onRandomPrompt={handleRandomPrompt}
      />


      {/* Error banner */}
      {loadError && (
        <div className="rounded-xs border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600">
          {loadError}
        </div>
      )}

      {/* 2. Main 2-Column Layout: Sidebar (20-30%) on left, List & Detail (70-80%) on right */}
      <div className="flex flex-col md:flex-row gap-3 w-full items-start">
        {/* Left Column: Sidebar with Skills, Parts, Schools, Batches & Search */}
        <PromptSidebar
          selectedSkill={selectedSkill}
          selectedPart={selectedPart}
          selectedSchool={selectedSchool}
          selectedBatch={selectedBatch}
          search={search}
          filteredCount={filteredPrompts.length}
          counts={counts}
          availableSchools={availableSchools}
          availableBatches={availableBatches}
          onSkillSelect={(skill, part) => {
            setSelectedSkill(skill);
            setSelectedPart(part);
          }}
          onSchoolChange={handleSchoolChange}
          onBatchChange={handleBatchChange}
          onSearchChange={setSearch}
          onOpenExport={() => {
            setCustomExportConfig({});
            setIsExportOpen(true);
          }}
          onRandomPrompt={handleRandomPrompt}
        />

        {/* Right Column: Active Exam Detail Card + Prompt List Grid */}
        <main className="flex-1 min-w-0 space-y-3 w-full">
          {/* Selected Prompt Detail Card (if open) */}
          <div ref={promptPanelRef}>
            {selectedPrompt && (
              <PromptDetailCard
                prompt={selectedPrompt}
                copied={copiedPromptId === selectedPrompt.id}
                onCopy={() => void handleCopyPrompt(selectedPrompt)}
                onClose={() => setSelectedPrompt(null)}
                onPracticeWriting={handlePracticeWriting}
                onPracticeSpeaking={handlePracticeSpeaking}
              />
            )}
          </div>

          {/* List of Prompts (Cards Grid across full width with Loading Skeleton & Quick Actions) */}
          <PromptList
            prompts={filteredPrompts}
            isLoading={isLoading}
            isDownloading={isDownloading}
            selectedPromptId={selectedPrompt?.id}
            copiedPromptId={copiedPromptId}
            copiedAll={copiedAll}
            onlyNew={onlyNew}
            newPromptsCount={newPromptsCount}
            sortMode={sortMode}
            onToggleOnlyNew={() => setOnlyNew((prev) => !prev)}
            onSortModeChange={setSortMode}
            onSelectPrompt={handleSelectPrompt}
            onCopyPrompt={(prompt) => void handleCopyPrompt(prompt)}
            onCopyAll={() => void handleCopyAll()}
            onDownloadCurrent={handleDirectDownloadCurrent}
            onOpenExportCurrent={handleOpenExportCurrent}
          />
        </main>
      </div>

      {/* 3. Export Markdown Modal */}
      <PromptExportModal
        isOpen={isExportOpen}
        allPrompts={allPrompts}
        availableSchools={availableSchools}
        availableBatches={availableBatches}
        initialConfig={customExportConfig}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
