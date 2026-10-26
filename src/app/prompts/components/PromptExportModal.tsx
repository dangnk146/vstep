'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckSquare,
  Code2,
  Copy,
  Download,
  Eye,
  FileDown,
  Square,
  X,
} from 'lucide-react';
import { getExamCategory, type ExamPrompt } from '@/utils/examPrompts';
import type { ExportConfig } from '../types';
import { downloadMarkdownFile, generatePromptsMarkdown } from '../utils';

interface PromptExportModalProps {
  isOpen: boolean;
  allPrompts: ExamPrompt[];
  availableSchools: string[];
  availableBatches: string[];
  initialConfig?: Partial<ExportConfig>;
  onClose: () => void;
}

export function PromptExportModal({
  isOpen,
  allPrompts,
  availableSchools,
  availableBatches,
  initialConfig,
  onClose,
}: PromptExportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  const [config, setConfig] = useState<ExportConfig>({
    category: initialConfig?.category || 'all',
    schools: initialConfig?.schools || [],
    batches: initialConfig?.batches || [],
    includeMetadata: initialConfig?.includeMetadata ?? true,
    numbering: initialConfig?.numbering ?? true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep config in sync whenever modal is opened with new initialConfig
  useEffect(() => {
    if (isOpen) {
      setConfig({
        category: initialConfig?.category || 'all',
        schools: initialConfig?.schools || [],
        batches: initialConfig?.batches || [],
        includeMetadata: initialConfig?.includeMetadata ?? true,
        numbering: initialConfig?.numbering ?? true,
      });
    }
  }, [isOpen, initialConfig]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter prompts for export
  const promptsForExport = useMemo(() => {
    return allPrompts.filter((prompt) => {
      // Category filter
      if (config.category === 'speaking-all' && !prompt.category.startsWith('speaking-')) return false;
      if (config.category === 'writing-all' && !prompt.category.startsWith('writing-')) return false;
      if (
        config.category !== 'all' &&
        config.category !== 'speaking-all' &&
        config.category !== 'writing-all' &&
        prompt.category !== config.category
      ) {
        return false;
      }

      // Schools filter (empty means all)
      if (config.schools.length > 0) {
        const pSchool = (prompt.school || '').toUpperCase().trim();
        if (!config.schools.map((s) => s.toUpperCase().trim()).includes(pSchool)) {
          return false;
        }
      }

      // Batches filter (empty means all)
      if (config.batches.length > 0) {
        const cleanPromptBatch = (prompt.batch || '').replace(/[\/-]/g, '').toLowerCase().trim();
        const matches = config.batches.some(
          (b) => b.replace(/[\/-]/g, '').toLowerCase().trim() === cleanPromptBatch || b === prompt.batch,
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [allPrompts, config]);

  // Generate markdown string
  const markdownContent = useMemo(() => {
    let partLabel = 'Tất cả các phần thi';
    if (config.category === 'speaking-all') partLabel = 'Speaking (Toàn bộ Part 1, 2, 3)';
    else if (config.category === 'writing-all') partLabel = 'Writing (Toàn bộ Task 1, 2)';
    else if (config.category !== 'all') {
      const cat = getExamCategory(config.category);
      if (cat) partLabel = cat.label;
    }

    const schoolsLabel = config.schools.length > 0 ? config.schools.join(', ') : 'Tất cả các trường';
    const batchesLabel = config.batches.length > 0 ? config.batches.join(', ') : 'Tất cả các đợt thi';

    return generatePromptsMarkdown(promptsForExport, {
      categoryLabel: partLabel,
      schoolsLabel,
      batchesLabel,
      includeMetadata: config.includeMetadata,
      numbering: config.numbering,
    });
  }, [promptsForExport, config]);

  // Suggested filename
  const downloadFileName = useMemo(() => {
    let catSlug = 'all-parts';
    if (config.category === 'speaking-all') catSlug = 'speaking-all';
    else if (config.category === 'writing-all') catSlug = 'writing-all';
    else if (config.category !== 'all') catSlug = config.category;

    const schoolSlug = config.schools.length > 0 ? config.schools.join('-') : 'all-schools';
    const batchSlug = config.batches.length > 0 ? config.batches.map((b) => b.replace(/[\/-]/g, '')).join('-') : 'all-batches';

    return `VSTEP_${catSlug}_${schoolSlug}_${batchSlug}.md`;
  }, [config]);

  const handleDownload = () => {
    downloadMarkdownFile(downloadFileName, markdownContent);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Không thể sao chép vào clipboard.');
    }
  };

  const toggleSchool = (sch: string) => {
    setConfig((prev) => {
      const exists = prev.schools.includes(sch);
      const next = exists ? prev.schools.filter((s) => s !== sch) : [...prev.schools, sch];
      return { ...prev, schools: next };
    });
  };

  const toggleBatch = (b: string) => {
    setConfig((prev) => {
      const exists = prev.batches.includes(b);
      const next = exists ? prev.batches.filter((item) => item !== b) : [...prev.batches, b];
      return { ...prev, batches: next };
    });
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="relative flex h-full max-h-[92vh] w-full max-w-4xl flex-col rounded-md border border-border bg-card shadow-2xl overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex h-11 items-center justify-between border-b border-border bg-[#245b86] px-4 text-white shrink-0">
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            <h2 id="export-modal-title" className="text-sm font-bold">
              Xem trước & Xuất ngân hàng đề VSTEP (Markdown)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-xs text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: Controls & Preview */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Controls bar */}
          <div className="border-b border-border bg-muted/40 p-3.5 space-y-3 shrink-0">
            {/* 1. Chọn Kỹ năng & Phần xuất */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                1. Phần thi cần xuất:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Tất cả các phần' },
                  { id: 'speaking-all', label: 'Speaking (Tất cả P1, 2, 3)' },
                  { id: 'speaking-part1', label: 'Speaking Part 1' },
                  { id: 'speaking-part2', label: 'Speaking Part 2' },
                  { id: 'speaking-part3', label: 'Speaking Part 3' },
                  { id: 'writing-all', label: 'Writing (Tất cả T1, 2)' },
                  { id: 'writing-task1', label: 'Writing Task 1' },
                  { id: 'writing-task2', label: 'Writing Task 2' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, category: opt.id as any }))}
                    className={`rounded-xs px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      config.category === opt.id
                        ? 'bg-[#7c3aed] text-white font-bold shadow-xs'
                        : 'border border-border bg-background text-foreground hover:border-[#7c3aed]/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Chọn Trường (Multi-Select) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  2. Chọn trường thi (có thể chọn nhiều trường):
                </span>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, schools: [] }))}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  {config.schools.length === 0 ? 'Đang chọn: Tất cả trường' : 'Chọn lại tất cả trường'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, schools: [] }))}
                  className={`rounded-xs px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    config.schools.length === 0
                      ? 'bg-[#7c3aed] text-white font-bold shadow-xs'
                      : 'border border-border bg-background text-foreground hover:border-[#7c3aed]/50'
                  }`}
                >
                  Tất cả các trường
                </button>
                {availableSchools.map((sch) => {
                  const isChecked = config.schools.includes(sch);
                  return (
                    <button
                      key={sch}
                      type="button"
                      onClick={() => toggleSchool(sch)}
                      className={`flex items-center gap-1 rounded-xs px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                        isChecked
                          ? 'bg-[#7c3aed] text-white font-bold shadow-xs'
                          : 'border border-border bg-background text-foreground hover:border-[#7c3aed]/50'
                      }`}
                    >
                      {isChecked ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                      <span>{sch}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Chọn Đợt thi */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  3. Đợt thi:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, batches: [] }))}
                    className={`rounded-xs px-2 py-0.5 text-xs font-semibold transition cursor-pointer ${
                      config.batches.length === 0
                        ? 'bg-[#7c3aed] text-white font-bold shadow-xs'
                        : 'border border-border bg-background text-foreground hover:border-[#7c3aed]/50'
                    }`}
                  >
                    Tất cả đợt
                  </button>
                  {availableBatches.map((b) => {
                    const isChecked = config.batches.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBatch(b)}
                        className={`flex items-center gap-1 rounded-xs px-2 py-0.5 text-xs font-semibold transition cursor-pointer ${
                          isChecked
                            ? 'bg-[#7c3aed] text-white font-bold shadow-xs'
                            : 'border border-border bg-background text-foreground hover:border-[#7c3aed]/50'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                        <span>Đợt {b}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Options */}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.includeMetadata}
                  onChange={(e) => setConfig((prev) => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="rounded-xs text-[#7c3aed]"
                />
                <span>Kèm metadata (Mã đề, Đợt thi, Nhóm đề)</span>
              </label>
            </div>
          </div>

          {/* View mode toggle & Action bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-card px-4 py-2 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7c3aed] dark:text-purple-400">
                Tìm thấy {promptsForExport.length} đề thi
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                | Tệp: <code className="font-mono text-[11px] text-foreground">{downloadFileName}</code>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Preview / Raw */}
              <div className="flex items-center rounded-xs border border-border bg-muted p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-1 rounded-xs px-2 py-1 text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'preview'
                      ? 'bg-card text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Xem trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-1 rounded-xs px-2 py-1 text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'raw'
                      ? 'bg-card text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Code2 className="h-3 w-3" />
                  <span>Mã Markdown</span>
                </button>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={promptsForExport.length === 0}
                className="flex items-center gap-1 rounded-xs border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground transition hover:bg-muted disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>

              {/* Download Button - MÀU TÍM NỔI BẬT */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={promptsForExport.length === 0}
                className="flex items-center gap-1.5 rounded-xs bg-[#7c3aed] hover:bg-[#6d28d9] px-3 py-1 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Tải về .md</span>
              </button>
            </div>
          </div>

          {/* Content Viewer */}
          <div className="flex-1 overflow-y-auto p-4 bg-background">
            {viewMode === 'preview' ? (
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 font-sans">
                <div className="rounded-sm border border-border bg-muted/30 p-3 text-xs leading-relaxed">
                  <div className="font-bold text-foreground text-sm mb-1">Tóm tắt tài liệu xuất:</div>
                  <div>• <strong>Phần thi:</strong> {config.category}</div>
                  <div>• <strong>Trường:</strong> {config.schools.length > 0 ? config.schools.join(', ') : 'Tất cả các trường'}</div>
                  <div>• <strong>Đợt thi:</strong> {config.batches.length > 0 ? config.batches.join(', ') : 'Tất cả các đợt thi'}</div>
                  <div>• <strong>Tổng số đề:</strong> {promptsForExport.length} đề</div>
                </div>

                {promptsForExport.map((p, idx) => (
                  <div key={p.id} className="rounded-sm border border-border bg-card p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                      <span className="font-bold text-sm text-foreground">
                        {idx + 1}. {p.title}
                      </span>
                      <span className="rounded-xs bg-[#7c3aed]/10 text-[#7c3aed] dark:text-purple-300 font-bold px-1.5 py-0.5 text-[10px]">
                        {p.category}
                      </span>
                    </div>

                    {config.includeMetadata && (
                      <div className="text-[11px] text-muted-foreground space-y-0.5">
                        {p.school && <div>Trường: <strong>{p.school}</strong> {p.batch && `· Đợt: ${p.batch}`}</div>}
                        {p.group && <div>Nhóm đề: {p.group}</div>}
                        <div>Mã: <code className="font-mono">{p.id}</code></div>
                      </div>
                    )}

                    <div className="whitespace-pre-line text-xs leading-relaxed text-foreground bg-muted/20 p-2.5 rounded-xs border border-border/50">
                      {p.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap select-all bg-card p-4 rounded-sm border border-border">
                {markdownContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
