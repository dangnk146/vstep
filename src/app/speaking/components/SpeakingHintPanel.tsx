'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  FileText,
  Lightbulb,
  LoaderCircle,
  TableProperties,
} from 'lucide-react';

type ParsedTableRow = {
  no: string;
  thinking?: string;
  answer: string;
  reason: string;
  example: string;
};

type GoiyItem = {
  id: string;
  title: string;
  markdown: string;
  questions?: string[];
  table: ParsedTableRow[];
};

interface SpeakingHintPanelProps {
  activeExamId: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function SpeakingHintPanel({
  activeExamId,
  isOpen,
  onToggle,
}: SpeakingHintPanelProps) {
  const [hintItems, setHintItems] = useState<GoiyItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'markdown'>('table');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Strictly fetch hints only when activeExamId exists
  useEffect(() => {
    const trimmedId = activeExamId?.trim();
    if (!trimmedId) {
      setHintItems([]);
      setSelectedTopicId('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/goiy?id=${encodeURIComponent(trimmedId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
          setHintItems(data.items);
          setSelectedTopicId(data.items[0].id);
        } else {
          setHintItems([]);
          setSelectedTopicId('');
        }
      })
      .catch((err) => {
        console.error('Error fetching hint details:', err);
        setHintItems([]);
        setSelectedTopicId('');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeExamId]);

  // Format cell text with <br>, bold (**text**), and bullet points
  const renderCellContent = (text: string) => {
    if (!text) return <span className="text-muted-foreground/60 italic">—</span>;
    const parts = text.split(/<br\s*\/?>/gi);
    return (
      <div className="space-y-1">
        {parts.map((part, index) => {
          const trimmed = part.trim();
          if (!trimmed) return <div key={index} className="h-1" />;
          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('+');
          const isSubheading = trimmed.endsWith(':') || trimmed.startsWith('=>');

          // Parse markdown bold **text** and <mark>highlight</mark>
          const renderFormatted = (raw: string) => {
            const segments = raw.split(/(\*\*[^*]+\*\*|<mark>[^<]+<\/mark>)/g);
            return segments.map((seg, sIdx) => {
              if (seg.startsWith('**') && seg.endsWith('**')) {
                const inner = seg.slice(2, -2);
                if (inner.includes('<mark>')) {
                  const innerSegs = inner.split(/(<mark>[^<]+<\/mark>)/g);
                  return (
                    <strong key={sIdx} className="font-semibold text-foreground">
                      {innerSegs.map((iseg, iIdx) =>
                        iseg.startsWith('<mark>') && iseg.endsWith('</mark>') ? (
                          <mark
                            key={iIdx}
                            className="bg-yellow-200 text-yellow-950 dark:bg-yellow-500/30 dark:text-yellow-200 px-1 py-0.5 rounded-2xs font-semibold"
                          >
                            {iseg.slice(6, -7)}
                          </mark>
                        ) : (
                          iseg
                        )
                      )}
                    </strong>
                  );
                }
                return (
                  <strong key={sIdx} className="font-semibold text-foreground">
                    {inner}
                  </strong>
                );
              }
              if (seg.startsWith('<mark>') && seg.endsWith('</mark>')) {
                return (
                  <mark
                    key={sIdx}
                    className="bg-yellow-200 text-yellow-950 dark:bg-yellow-500/30 dark:text-yellow-200 px-1 py-0.5 rounded-2xs font-semibold"
                  >
                    {seg.slice(6, -7)}
                  </mark>
                );
              }
              return seg;
            });
          };

          return (
            <p
              key={index}
              className={`text-xs leading-relaxed ${isSubheading ? 'font-semibold text-foreground/95' : 'text-foreground/80'
                } ${isBullet ? 'pl-2 text-foreground/85' : ''}`}
            >
              {renderFormatted(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Mở Bảng Gợi Ý (Speaking Outline)"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full border border-sky-400 bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer"
      >
        <Lightbulb className="h-4 w-4 animate-pulse text-amber-300" />
        <span>Gợi ý dàn ý</span>
      </button>
    );
  }

  const requestedIds = (activeExamId || '')
    .split(/[+,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const isMultiTopicExam = requestedIds.length > 1;

  const activeHint = hintItems.find((item) => item.id === selectedTopicId) || (isMultiTopicExam && selectedTopicId && !hintItems.some(h => h.id === selectedTopicId) ? null : hintItems[0]);
  const hasMultipleHints = hintItems.length > 1;

  return (
    <aside
      aria-label="Bảng dàn ý gợi ý trả lời"
      className="flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card shadow-xs"
    >
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-muted/60 px-3">
        <div className="flex items-center gap-1.5 min-w-0 text-xs font-bold text-foreground">
          <Lightbulb className="h-4 w-4 text-amber-500 fill-amber-400/20 shrink-0" />
          <span className="shrink-0">Gợi ý (A - R - E)</span>
          {isLoading && (
            <LoaderCircle className="h-3 w-3 animate-spin text-primary shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* View mode toggle - only show if there's active hint */}
          {activeHint && (
            <div className="flex items-center rounded-xs border border-border bg-background p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-1.5 py-0.5 rounded-2xs font-medium transition cursor-pointer ${viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="Xem dạng Bảng 4 cột"
              >
                <TableProperties className="h-3 w-3 inline mr-1" />
                Bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('markdown')}
                className={`px-1.5 py-0.5 rounded-2xs font-medium transition cursor-pointer ${viewMode === 'markdown'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="Xem dạng Markdown thô"
              >
                <FileText className="h-3 w-3 inline mr-1" />
                MD
              </button>
            </div>
          )}

          {/* Close / collapse button */}
          <button
            type="button"
            onClick={onToggle}
            title="Thu gọn bảng gợi ý"
            className="grid h-6 w-6 place-items-center rounded-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Multiple Topics Switcher Bar */}
      {isMultiTopicExam ? (
        <div className="flex items-center gap-1.5 border-b border-border bg-card px-3 py-1.5 text-xs overflow-x-auto">
          {requestedIds.map((reqId, index) => {
            const item = hintItems.find((h) => h.id === reqId);
            const isSelected = (activeHint?.id === reqId) || (!activeHint && selectedTopicId === reqId);
            return (
              <button
                key={reqId}
                type="button"
                onClick={() => setSelectedTopicId(reqId)}
                className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition cursor-pointer truncate max-w-[200px] ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : item
                    ? 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                    : 'bg-muted/30 text-muted-foreground/60 border border-dashed border-border'
                }`}
                title={item ? item.title : `Chưa có gợi ý cho ${reqId}`}
              >
                {item ? item.title : `Topic ${index + 1} (Chưa có gợi ý)`}
              </button>
            );
          })}
        </div>
      ) : hasMultipleHints ? (
        <div className="flex items-center gap-1.5 border-b border-border bg-card px-3 py-1.5 text-xs overflow-x-auto">
          {hintItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedTopicId(item.id)}
              className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition cursor-pointer truncate max-w-[200px] ${activeHint?.id === item.id
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              {item.title || `Topic ${index + 1}`}
            </button>
          ))}
        </div>
      ) : null}

      {/* Active Topic Title Banner */}
      {activeHint && (
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-3 py-1.5 text-xs">
          <span className="font-semibold text-foreground/90 truncate">
            {activeHint.title}
          </span>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {isLoading && !activeHint ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            <p>Đang tải dàn ý gợi ý…</p>
          </div>
        ) : !activeHint ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-muted-foreground p-4">
            <p className="font-semibold text-foreground/80">Chủ đề này chưa có dữ liệu gợi ý.</p>
            {hintItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTopicId(hintItems[0].id)}
                className="text-xs text-primary underline hover:opacity-80 cursor-pointer"
              >
                Xem gợi ý cho {hintItems[0].title}
              </button>
            )}
          </div>
        ) : (
          <div className={`space-y-2.5 transition-opacity duration-150 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* View Mode: Table */}
            {viewMode === 'table' ? (
              activeHint.table && activeHint.table.length > 0 ? (
                (() => {
                  const hasThinkingCol = activeHint.table.some((r) => Boolean(r.thinking && r.thinking.trim()));
                  const hasExampleCol = activeHint.table.some((r) => Boolean(r.example && r.example.trim()));
                  const getBadgeClass = (no: string) => {
                    if (no === '✓') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
                    if (no === '✗') return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold';
                    if (no.startsWith('Ý')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
                    if (no.startsWith('Q')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold';
                    return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 font-semibold';
                  };

                  return (
                    <div className="overflow-x-auto rounded-sm border border-border shadow-2xs">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/80 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="w-9 px-1.5 py-2 text-center">#</th>
                            {hasExampleCol && hasThinkingCol && (
                              <th className="min-w-[190px] max-w-[280px] px-2.5 py-2 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                                💡 Cách suy luận & Mục tiêu
                              </th>
                            )}
                            <th className="min-w-[120px] px-2.5 py-2">
                              {hasExampleCol ? 'Ý chính / Trả lời' : 'Option (Lựa chọn)'}
                            </th>
                            {!hasExampleCol && hasThinkingCol && (
                              <th className="min-w-[190px] max-w-[280px] px-2.5 py-2 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                                💡 Cách suy luận & Mục tiêu
                              </th>
                            )}
                            <th className="min-w-[190px] px-2.5 py-2">
                              {hasExampleCol ? 'Lập luận & Phát triển (A-R-E)' : 'Lý do & Lập luận (Reasons)'}
                            </th>
                            {hasExampleCol && (
                              <th className="min-w-[140px] px-2.5 py-2">Ví dụ (Example)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {activeHint.table.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-muted/40 transition-colors odd:bg-card even:bg-muted/15"
                            >
                              <td className="px-1.5 py-2.5 text-center align-top">
                                <span className={`inline-flex min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full text-[10px] whitespace-nowrap ${getBadgeClass(row.no)}`}>
                                  {row.no}
                                </span>
                              </td>
                              {hasExampleCol && hasThinkingCol && (
                                <td className="px-2.5 py-2.5 align-top bg-amber-50/40 dark:bg-amber-950/20 border-r border-amber-200/50 dark:border-amber-900/30">
                                  {renderCellContent(row.thinking || '')}
                                </td>
                              )}
                              <td className="px-2.5 py-2.5 align-top font-medium">
                                {renderCellContent(row.answer)}
                              </td>
                              {!hasExampleCol && hasThinkingCol && (
                                <td className="px-2.5 py-2.5 align-top bg-amber-50/40 dark:bg-amber-950/20 border-r border-amber-200/50 dark:border-amber-900/30">
                                  {renderCellContent(row.thinking || '')}
                                </td>
                              )}
                              <td className="px-2.5 py-2.5 align-top">
                                {renderCellContent(row.reason)}
                              </td>
                              {hasExampleCol && (
                                <td className="px-2.5 py-2.5 align-top text-muted-foreground">
                                  {renderCellContent(row.example)}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-sm border border-dashed border-border p-6 text-center text-muted-foreground">
                  Không tìm thấy cấu trúc bảng trong file này.
                </div>
              )
            ) : (
              /* View Mode: Raw Markdown */
              <pre className="max-h-[600px] overflow-auto rounded-sm border border-border bg-muted/30 p-3 font-mono text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">
                {activeHint.markdown}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Bám sát phương pháp A - R - E</span>
        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">VSTEP B1 - B2</span>
      </div>
    </aside>
  );
}
