'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Search,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import {
  EXAM_CATEGORIES,
  EXAM_PROMPTS,
  getExamSets,
  getExamCategory,
  toPromptEditorHtml,
  toReadablePromptText,
  type ExamCategory,
  type ExamPrompt,
} from '@/utils/examPrompts';

export default function PromptBankPage() {
  const [activeCategory, setActiveCategory] = useState<ExamCategory>('writing-task1');
  const [activeSetId, setActiveSetId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<ExamPrompt | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const promptPanelRef = useRef<HTMLElement>(null);

  const categoryPrompts = useMemo(
    () => EXAM_PROMPTS.filter((prompt) => prompt.category === activeCategory),
    [activeCategory],
  );

  const sets = useMemo(
    () => getExamSets(activeCategory),
    [activeCategory],
  );

  const filteredPrompts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    return categoryPrompts.filter((prompt) => {
      const matchesSet = activeSetId === 'all' || prompt.setId === activeSetId;
      const matchesSearch = !normalizedSearch
        || `${prompt.title} ${prompt.group} ${prompt.content}`.toLocaleLowerCase('vi').includes(normalizedSearch);
      return matchesSet && matchesSearch;
    });
  }, [activeSetId, categoryPrompts, search]);

  const selectPrompt = (prompt: ExamPrompt) => {
    setSelectedPrompt(prompt);
    setActiveCategory(prompt.category);
    setActiveSetId(prompt.setId);
    setCopied(false);
    setCopyError('');
    window.requestAnimationFrame(() => promptPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const chooseRandom = () => {
    const candidates = categoryPrompts;
    if (candidates.length === 0) return;
    selectPrompt(candidates[Math.floor(Math.random() * candidates.length)]);
  };

  const storeWritingPrompt = (prompt: ExamPrompt) => {
    const task = prompt.category === 'writing-task1' ? 'task1' : 'task2';
    sessionStorage.setItem('vstep_bank_writing_prompt', JSON.stringify({
      id: prompt.id,
      title: prompt.title,
      content: toReadablePromptText(prompt.content),
      task,
    }));
  };

  const storeSpeakingPrompt = (prompt: ExamPrompt) => {
    localStorage.setItem('vstep_speaking_custom_exam_html', toPromptEditorHtml(prompt));
    localStorage.setItem('vstep_speaking_active_exam', prompt.id);
    const part = prompt.category.replace('speaking-', 'part');
    if (part === 'part1' || part === 'part2' || part === 'part3') {
      localStorage.setItem('vstep_speaking_active_part', part);
    }
  };

  const copyPrompt = async () => {
    if (!selectedPrompt) return;
    try {
      await navigator.clipboard.writeText(`${selectedPrompt.title}\n\n${toReadablePromptText(selectedPrompt.content)}`);
      setCopied(true);
      setCopyError('');
    } catch (error) {
      console.error('Could not copy the selected exam prompt.', error);
      setCopyError('Không thể sao chép đề. Hãy kiểm tra quyền truy cập clipboard của trình duyệt.');
    }
  };

  const selectedCategory = selectedPrompt ? getExamCategory(selectedPrompt.category) : null;
  const writingTask = selectedPrompt?.category === 'writing-task1' ? 'task1' : 'task2';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12 animate-fade-in">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              VSTEP · THƯ VIỆN ĐỀ
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Ngân hàng đề thi</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Tìm và xem đề theo từng phần, hoặc chọn ngẫu nhiên một đề để bắt đầu luyện viết và luyện nói.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-muted px-4 py-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-extrabold leading-none text-foreground">{EXAM_PROMPTS.length}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">đề trong thư viện</p>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Chọn đề ngẫu nhiên">
        <button
          type="button"
          onClick={chooseRandom}
          disabled={categoryPrompts.length === 0}
          className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Shuffle className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold text-foreground">Bốc đề ngẫu nhiên trong phần đang chọn</span>
              <span className="mt-1 block text-xs text-muted-foreground">{getExamCategory(activeCategory).label} · {categoryPrompts.length} đề</span>
            </span>
          </span>
          <Shuffle className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5" aria-label="Lọc ngân hàng đề">
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">1. Chọn kỹ năng và phần thi</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_CATEGORIES.map((category) => {
                const count = EXAM_PROMPTS.filter((prompt) => prompt.category === category.id).length;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.id);
                      setActiveSetId('all');
                      setSelectedPrompt(null);
                    }}
                    aria-pressed={activeCategory === category.id}
                    className={`rounded-xl px-3.5 py-2 text-sm font-bold transition cursor-pointer ${activeCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    {category.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">2. Chọn bộ đề hoặc một đề cụ thể</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
                Bộ đề / chủ đề
                <select
                  value={activeSetId}
                  onChange={(event) => {
                    setActiveSetId(event.target.value);
                    setSelectedPrompt(null);
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Tất cả bộ đề</option>
                  {sets.map((set) => <option key={set.id} value={set.id}>{set.title}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
                Chọn đề / câu hỏi
                <select
                  value={selectedPrompt && filteredPrompts.some((prompt) => prompt.id === selectedPrompt.id) ? selectedPrompt.id : ''}
                  onChange={(event) => {
                    const prompt = filteredPrompts.find((item) => item.id === event.target.value);
                    if (prompt) selectPrompt(prompt);
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Chọn đề trong danh sách…</option>
                  {filteredPrompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.title}</option>)}
                </select>
              </label>
            </div>
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên đề, chủ đề hoặc nội dung..."
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
      </section>

      {selectedPrompt && selectedCategory && (
        <section ref={promptPanelRef} className="scroll-mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-sm" aria-labelledby="selected-prompt-title">
          <div className="flex flex-col gap-4 border-b border-border bg-primary/5 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">
                {selectedCategory.label}
              </span>
              <h2 id="selected-prompt-title" className="mt-2 text-xl font-extrabold text-foreground">{selectedPrompt.title}</h2>
              {selectedPrompt.group && <p className="mt-1 text-xs font-medium text-muted-foreground">{selectedPrompt.group}</p>}
            </div>
            <button
              type="button"
              onClick={copyPrompt}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground transition hover:bg-muted cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4" />}
              {copied ? 'Đã sao chép' : 'Sao chép đề'}
            </button>
          </div>
          <div className="whitespace-pre-line px-5 py-5 text-sm leading-7 text-foreground md:px-6">
            {toReadablePromptText(selectedPrompt.content) || 'Đề thi chưa có nội dung chi tiết.'}
          </div>
          {copyError && <p role="alert" className="px-5 pb-3 text-xs font-semibold text-red-600">{copyError}</p>}
          <div className="flex flex-wrap gap-3 border-t border-border px-5 py-4 md:px-6">
            {selectedCategory.skill === 'writing' ? (
              <Link
                href={`/writing/${writingTask}?exam=${encodeURIComponent(selectedPrompt.id)}`}
                onClick={() => storeWritingPrompt(selectedPrompt)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Luyện viết đề này <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href={`/speaking/${selectedPrompt.category.replace('speaking-', 'part')}?exam=${encodeURIComponent(selectedPrompt.id)}`}
                onClick={() => storeSpeakingPrompt(selectedPrompt)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Luyện nói đề này <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSelectedPrompt(null)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" /> Đóng đề
            </button>
          </div>
        </section>
      )}

      <section aria-label="Danh sách đề thi">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-foreground">Các đề hiện có</h2>
          <span className="text-xs font-semibold text-muted-foreground">{filteredPrompts.length} đề</span>
        </div>
        {filteredPrompts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPrompts.map((prompt) => {
              const category = getExamCategory(prompt.category);
              const isSelected = selectedPrompt?.id === prompt.id;
              return (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => selectPrompt(prompt)}
                  aria-pressed={isSelected}
                  className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card shadow-sm hover:border-primary/40'}`}
                >
                  <span className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-extrabold text-muted-foreground">{category.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                  <span className="block font-bold leading-5 text-foreground">{prompt.title}</span>
                  {prompt.group && <span className="mt-2 block line-clamp-2 text-xs leading-5 text-muted-foreground">{prompt.group}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <p className="font-bold text-foreground">Không tìm thấy đề phù hợp</p>
            <p className="mt-1 text-sm text-muted-foreground">Thử đổi từ khóa hoặc chọn phần thi khác.</p>
          </div>
        )}
      </section>
    </div>
  );
}
