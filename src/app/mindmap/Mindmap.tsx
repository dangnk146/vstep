'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  GraduationCap,
  Trees,
  HeartPulse,
  Cpu,
  Briefcase,
  Compass,
  Users,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  FolderTree,
  Move,
  Lightbulb,
  FileText,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';
import { MINDMAP_TOPICS, MindmapTopic, MindmapNode } from './data';

interface PathEdge {
  id: string;
  d: string;
  color: string;
}

// Highlight matched search keywords
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const trimmedQuery = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(trimmedQuery);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + trimmedQuery.length);
  const after = text.slice(index + trimmedQuery.length);

  return (
    <span>
      {before}
      <mark className="rounded-xs bg-amber-300 px-0.5 font-bold text-amber-950 dark:bg-amber-400 dark:text-amber-950">
        {match}
      </mark>
      <HighlightText text={after} query={query} />
    </span>
  );
}

// Check if node or its descendants match search query
function nodeMatchesQuery(node: MindmapNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.title.toLowerCase().includes(q)) return true;
  if (node.viTitle && node.viTitle.toLowerCase().includes(q)) return true;
  if (node.keywords?.some((k) => k.word.toLowerCase().includes(q) || k.meaning.toLowerCase().includes(q))) {
    return true;
  }
  if (
    node.areSkeleton &&
    (node.areSkeleton.answer.toLowerCase().includes(q) ||
      node.areSkeleton.answerVi.toLowerCase().includes(q) ||
      node.areSkeleton.reason.toLowerCase().includes(q) ||
      node.areSkeleton.reasonVi.toLowerCase().includes(q) ||
      node.areSkeleton.example.toLowerCase().includes(q) ||
      node.areSkeleton.exampleVi.toLowerCase().includes(q))
  ) {
    return true;
  }
  if (
    node.items?.some((item) => {
      if (typeof item === 'string') return item.toLowerCase().includes(q);
      return item.text.toLowerCase().includes(q) || (item.viText && item.viText.toLowerCase().includes(q));
    })
  ) {
    return true;
  }
  if (node.children?.some((child) => nodeMatchesQuery(child, query))) {
    return true;
  }
  return false;
}

// =========================================================================
// 2-COLUMN CLEAN OUTLINE VIEW (UNIFIED WITH /prompts & /speaking)
// =========================================================================
function OutlineDocumentView({
  topics,
  activeTopicId,
  onSelectTopic,
  searchQuery,
  onSearchChange,
  showVietnamese,
  onCopy,
  getTopicIcon,
}: {
  topics: MindmapTopic[];
  activeTopicId: MindmapTopic['id'];
  onSelectTopic: (id: MindmapTopic['id']) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showVietnamese: boolean;
  onCopy: (text: string, id?: string) => void;
  getTopicIcon: (iconName: string) => React.ReactNode;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubtopicId, setActiveSubtopicId] = useState<string | null>(null);

  const activeTopic = useMemo(
    () => topics.find((t) => t.id === activeTopicId) || topics[0],
    [topics, activeTopicId]
  );

  const activeBranches = useMemo(
    () => [...activeTopic.leftBranches, ...activeTopic.rightBranches],
    [activeTopic]
  );

  // Filter branches & children by search query
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return activeBranches;
    return activeBranches
      .map((branch) => ({
        ...branch,
        children: (branch.children || []).filter((sub) => nodeMatchesQuery(sub, searchQuery)),
      }))
      .filter((branch) => branch.children.length > 0);
  }, [activeBranches, searchQuery]);

  const totalTopicsInHub = useMemo(
    () => activeBranches.reduce((acc, b) => acc + (b.children?.length || 0), 0),
    [activeBranches]
  );

  const filteredTopicsCount = useMemo(
    () => filteredBranches.reduce((acc, b) => acc + (b.children?.length || 0), 0),
    [filteredBranches]
  );

  const handleCopyTopic = (subtopic: MindmapNode) => {
    let text = `${subtopic.title}\n`;
    if (subtopic.keywords?.length) {
      text += `Keywords: ${subtopic.keywords.map((k) => `${k.word} (${k.meaning})`).join(', ')}\n`;
    }
    if (subtopic.items?.length) {
      subtopic.items.forEach((it, idx) => {
        const t = typeof it === 'string' ? it : it.text;
        const v = typeof it === 'string' ? '' : it.viText ? ` - ${it.viText}` : '';
        text += `${idx + 1}. ${t}${v}\n`;
      });
    }
    if (subtopic.areSkeleton) {
      const are = subtopic.areSkeleton;
      text += `[A] ${are.answer}\n[R] ${are.reason}\n[E] ${are.example}\n`;
    }
    onCopy(text, subtopic.id);
    setCopiedId(subtopic.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const scrollToTopic = (id: string) => {
    setActiveSubtopicId(id);
    const el = document.getElementById(`topic-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Global topic counter across current hub for clean numbering (1, 2, 3...)
  let topicCounter = 0;
  let sidebarCounter = 0;

  const getBranchEnTitle = (id: string, viTitle: string) => {
    const enBranchMap: Record<string, string> = {
      'edu-group-reading-books': 'Books, E-books & Libraries',
      'edu-group-language-technology': 'Languages, AI & Learning Tools',
      'edu-group-university-skills': 'Higher Ed, Soft Skills & Discipline',
      'health-group-diet-nutrition': 'Nutrition, Diet & Eating Habits',
      'health-group-sports-mental': 'Sports, Mental Health & Lifestyle',
      'tech-group-social-media': 'Social Media, Cybercrime & AI',
      'tech-group-shopping-smart': 'E-Commerce, Cashless & Tech Waste',
      'work-group-employment-career': 'Self-Employment, Remote & Careers',
      'work-group-skills-success': 'Workplace Skills, Balance & Finance',
      'soc-group-family-relationships': 'Family, Marriage & Relationships',
      'soc-group-urban-environment-travel': 'Urban Life, Transport & Environment',
    };
    return enBranchMap[id] || viTitle;
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full items-start select-text">
      {/* =========================================================================
          CỘT 1: SIDEBAR DANH MỤC CHỦ ĐỀ & ĐỀ MỤC (Tiếng Anh 100%, Full nội dung, Không sticky)
          ========================================================================= */}
      <aside className="w-full md:w-64 lg:w-72 xl:w-80 shrink-0 space-y-2.5">
        {/* 1. Ô tìm kiếm */}
        <div className="rounded-sm border border-border bg-card p-2.5 shadow-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Search className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            Tìm kiếm chủ đề & từ vựng
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search topics (books, AI, charity...)"
              className="h-8 w-full rounded-xs border border-border bg-background pl-8 pr-7 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-purple-600 select-text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Chọn 5 Nhóm Chủ đề lớn (Hubs) - Tiêu đề tiếng Anh */}
        <div className="rounded-sm border border-border bg-card p-2.5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              5 Major Topic Hubs
            </span>
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
              {filteredTopicsCount}/{totalTopicsInHub}
            </span>
          </div>

          <div className="space-y-0.5">
            {topics.map((t) => {
              const active = t.id === activeTopic.id;
              const count = [...t.leftBranches, ...t.rightBranches].reduce(
                (acc, b) => acc + (b.children?.length || 0),
                0
              );

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTopic(t.id);
                    setActiveSubtopicId(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xs px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${active
                      ? 'bg-[#245b86] text-white shadow-xs'
                      : 'text-foreground hover:bg-muted'
                    }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {getTopicIcon(t.icon)}
                    <span className="truncate">{t.title}</span>
                  </span>
                  <span
                    className={`rounded-xs px-1.5 py-0.2 text-[10px] shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Đề mục cấp 1 & Các chủ đề con của Hub đang chọn (Full nội dung, Không scrollbar nội bộ, Tiếng Anh) */}
        <div className="rounded-sm border border-border bg-card p-2.5 shadow-xs space-y-2.5">
          {activeBranches.map((branch, bIdx) => {
            const children = branch.children || [];
            return (
              <div
                key={branch.id}
                className={`space-y-1 ${bIdx > 0 ? 'pt-2 border-t border-border/60' : ''}`}
              >
                <div className="px-1 text-[11px] font-bold uppercase tracking-wide text-purple-700 dark:text-purple-400">
                  Part {bIdx + 1}: {getBranchEnTitle(branch.id, branch.title)}
                </div>

                <div className="space-y-0.5">
                  {children.map((sub) => {
                    sidebarCounter++;
                    const isSelected = activeSubtopicId === sub.id;
                    const matched = nodeMatchesQuery(sub, searchQuery);
                    const enMatch = sub.title.match(/\(([^)]+)\)/);
                    const enTitle = enMatch ? enMatch[1].trim() : sub.title;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => scrollToTopic(sub.id)}
                        className={`flex w-full items-center justify-between rounded-xs px-2 py-1 text-left text-xs transition cursor-pointer ${!matched
                            ? 'opacity-35'
                            : isSelected
                              ? 'bg-purple-100 font-bold text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border-l-2 border-purple-600'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                      >
                        <span className="truncate">
                          {sidebarCounter}. {enTitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* =========================================================================
          CỘT 2: NỘI DUNG CHI TIẾT (Phối màu Đỏ Ruby & Tím Sinh Động, Mở 100%)
          ========================================================================= */}
      <main className="flex-1 min-w-0 space-y-3 w-full select-text">
        {filteredBranches.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm font-bold text-foreground">Không tìm thấy chủ đề phù hợp</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Thử tìm với từ khóa khác hoặc chuyển sang nhóm chủ đề lớn bên trái.
            </p>
          </div>
        ) : (
          filteredBranches.map((branch, bIdx) => {
            const children = branch.children || [];

            return (
              <section key={branch.id} className="space-y-2.5">
                {/* Đề mục cấp 1 (Tông màu Tím Thạch Anh sinh động) */}
                <div className="flex items-center justify-between rounded-sm border-l-4 border-purple-600 bg-purple-500/10 dark:bg-purple-950/20 px-3 py-2 border border-purple-200 dark:border-purple-900/40 shadow-xs">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-purple-800 dark:text-purple-300">
                    Phần {bIdx + 1}: {branch.title}
                  </h2>
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-xs">
                    {children.length} chủ đề
                  </span>
                </div>

                {/* Danh sách các chủ đề con */}
                <div className="space-y-2.5">
                  {children.map((subtopic) => {
                    topicCounter++;
                    const items = subtopic.items || [];
                    const keywords = subtopic.keywords || [];
                    const are = subtopic.areSkeleton;
                    const isCopied = copiedId === subtopic.id;
                    const isHighlighted = activeSubtopicId === subtopic.id;

                    const enMatch = subtopic.title.match(/\(([^)]+)\)/);
                    const enTitle = enMatch ? enMatch[1].trim() : '';
                    const viTitle = subtopic.title.split('(')[0].trim();

                    return (
                      <article
                        key={subtopic.id}
                        id={`topic-${subtopic.id}`}
                        className={`scroll-mt-14 rounded-sm border bg-card p-3.5 shadow-xs space-y-2.5 transition select-text ${isHighlighted
                            ? 'border-purple-600 ring-1 ring-purple-600/30'
                            : 'border-border hover:border-border/90'
                          }`}
                      >
                        {/* 1. Tên chủ đề: Badge Đỏ Ruby + Tiếng Việt + Tiếng Anh Tím Nổi Bật */}
                        <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                          <div className="space-y-0.5">
                            <h3 className="text-sm sm:text-[15px] font-bold text-foreground leading-snug flex items-baseline gap-1.5 flex-wrap">
                              <span className="inline-flex h-5 items-center justify-center rounded-xs bg-rose-600 text-white font-bold text-[11px] px-1.5 shadow-2xs shrink-0">
                                #{topicCounter}
                              </span>
                              <span className="text-foreground">
                                <HighlightText text={enTitle} query={searchQuery} />
                              </span>
                            </h3>
                            {viTitle && (
                              <p className="text-xs sm:text-[13px] font-bold text-purple-700 dark:text-purple-400 pl-0.5">
                                <HighlightText text={viTitle} query={searchQuery} />
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyTopic(subtopic)}
                            title="Sao chép chủ đề này"
                            className="flex h-6 shrink-0 items-center gap-1 rounded-xs border border-border bg-muted/40 px-2 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Chép</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* 2. Từ vựng cốt lõi (Tông Đỏ Ruby nhẹ dễ nhìn) */}
                        {keywords.length > 0 && (
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs leading-relaxed">
                            <span className="font-bold text-rose-700 dark:text-rose-400 shrink-0">
                              Từ vựng:
                            </span>
                            {keywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="inline-flex items-baseline rounded-xs bg-rose-50/60 dark:bg-rose-950/30 px-1.5 py-0.5 border border-rose-200/80 dark:border-rose-900/50"
                              >
                                <strong className="font-bold text-foreground">
                                  <HighlightText text={kw.word} query={searchQuery} />
                                </strong>
                                {showVietnamese && (
                                  <span className="text-muted-foreground ml-1 text-[11px]">
                                    (<HighlightText text={kw.meaning} query={searchQuery} />)
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 3. Ý chính triển khai (Gạch đầu dòng trực tiếp giống speaking.part3.v2.md) */}
                        {items.length > 0 && (
                          <ol className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed pl-4 list-decimal marker:font-bold marker:text-purple-600 dark:marker:text-purple-400">
                            {items.map((item, itIdx) => {
                              const text = typeof item === 'string' ? item : item.text;
                              const viText = typeof item === 'string' ? undefined : item.viText;

                              return (
                                <li key={itIdx} className="pl-1">
                                  <span className="font-semibold text-foreground">
                                    <HighlightText text={text} query={searchQuery} />
                                  </span>
                                  {showVietnamese && viText && (
                                    <span className="text-muted-foreground ml-1.5">
                                      — <HighlightText text={viText} query={searchQuery} />
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        )}

                        {/* 4. Khung trả lời nhanh A-R-E (Tím - Đỏ - Xanh Ngọc sinh động) */}
                        {are && (
                          <div className="rounded-xs border-l-3 border-purple-600 bg-purple-500/5 dark:bg-purple-950/20 px-3 py-2 space-y-1 text-xs leading-relaxed">
                            <div>
                              <span className="font-bold text-purple-700 dark:text-purple-400 mr-1.5">
                                [A - Trả lời]:
                              </span>
                              <span className="font-semibold text-foreground">
                                <HighlightText text={are.answer} query={searchQuery} />
                              </span>
                              {showVietnamese && (
                                <span className="text-muted-foreground ml-1.5">
                                  ({are.answerVi})
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-rose-700 dark:text-rose-400 mr-1.5">
                                [R - Lý do]:
                              </span>
                              <span className="font-semibold text-foreground">
                                <HighlightText text={are.reason} query={searchQuery} />
                              </span>
                              {showVietnamese && (
                                <span className="text-muted-foreground ml-1.5">
                                  ({are.reasonVi})
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-1.5">
                                [E - Ví dụ]:
                              </span>
                              <span className="font-semibold text-foreground">
                                <HighlightText text={are.example} query={searchQuery} />
                              </span>
                              {showVietnamese && (
                                <span className="text-muted-foreground ml-1.5">
                                  ({are.exampleVi})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}

// =========================================================================
// MINDMAP CANVAS NODES (WHEN USER SWITCHES TO GRAPH MODE)
// =========================================================================
function RootCard({
  node,
  registerAnchor,
}: {
  node: MindmapTopic['centerNode'];
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  return (
    <div
      ref={(el) => registerAnchor('root-center', el)}
      className="relative z-20 flex flex-col items-center justify-center rounded-sm border-2 border-[#245b86] bg-[#245b86] px-5 py-3.5 text-center text-white shadow-md"
    >
      <div
        ref={(el) => registerAnchor('root-left', el)}
        className="absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 opacity-0"
      />
      <div
        ref={(el) => registerAnchor('root-right', el)}
        className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 opacity-0"
      />
      <h2 className="text-base font-bold tracking-tight sm:text-lg">{node.title}</h2>
      <p className="mt-0.5 text-[11px] text-white/85">{node.subtitle}</p>
    </div>
  );
}

function Level1Card({
  node,
  direction,
  branchColor,
  isCollapsed,
  hasChildren,
  onToggleCollapse,
  searchQuery,
  showVietnamese,
  registerAnchor,
}: {
  node: MindmapNode;
  direction: 'left' | 'right';
  branchColor: string;
  isCollapsed: boolean;
  hasChildren: boolean;
  onToggleCollapse: () => void;
  searchQuery: string;
  showVietnamese: boolean;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  const isRight = direction === 'right';
  const isMatched = nodeMatchesQuery(node, searchQuery);

  return (
    <div
      ref={(el) => registerAnchor(node.id, el)}
      className={`group relative z-10 flex cursor-pointer items-center gap-2 rounded-sm border-2 bg-card px-3.5 py-2.5 shadow-xs transition ${isRight ? 'flex-row text-left' : 'flex-row-reverse text-right'
        } ${searchQuery && !isMatched ? 'opacity-30' : 'opacity-100'}`}
      style={{ borderColor: branchColor }}
      onClick={hasChildren ? onToggleCollapse : undefined}
    >
      <div className="flex flex-col">
        <span className="text-xs font-bold text-foreground">
          <HighlightText text={node.title} query={searchQuery} />
        </span>
        {showVietnamese && node.viTitle && (
          <span className="text-[11px] text-muted-foreground mt-0.5">
            <HighlightText text={node.viTitle} query={searchQuery} />
          </span>
        )}
      </div>

      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="grid h-4 w-4 shrink-0 place-items-center rounded-xs bg-muted text-[10px] font-bold text-foreground hover:bg-muted-foreground hover:text-white cursor-pointer"
        >
          {isCollapsed ? '+' : '−'}
        </button>
      )}
    </div>
  );
}

function UnderlinedNode({
  id,
  text,
  viText,
  direction,
  branchColor,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  onCopy,
  searchQuery,
  showVietnamese,
  registerAnchor,
}: {
  id: string;
  text: string;
  viText?: string;
  direction: 'left' | 'right';
  branchColor: string;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCopy: (text: string) => void;
  searchQuery: string;
  showVietnamese: boolean;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  const isRight = direction === 'right';
  const isMatched =
    searchQuery &&
    (text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (viText && viText.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onCopy(text);
      }}
      className={`group relative inline-flex flex-col cursor-pointer max-w-[320px] sm:max-w-[380px] ${isRight ? 'items-start text-left' : 'items-end text-right'
        } ${searchQuery && !isMatched ? 'opacity-35' : 'opacity-100'}`}
    >
      <div className={`flex flex-col gap-0.5 pb-1 w-full ${isRight ? 'items-start' : 'items-end'}`}>
        <div className={`flex items-baseline gap-1.5 ${isRight ? 'flex-row' : 'flex-row-reverse'}`}>
          <span className="text-xs font-semibold text-foreground">
            <HighlightText text={text} query={searchQuery} />
          </span>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse?.();
              }}
              className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-white font-bold text-[10px] cursor-pointer"
              style={{ backgroundColor: branchColor }}
            >
              {isCollapsed ? '+' : '−'}
            </button>
          )}
        </div>

        {showVietnamese && viText && (
          <div className="text-[11px] text-muted-foreground">
            <HighlightText text={viText} query={searchQuery} />
          </div>
        )}
      </div>

      <div
        ref={(el) => registerAnchor(id, el)}
        className="h-[2px] w-full rounded-full"
        style={{ backgroundColor: branchColor }}
      />
    </div>
  );
}

function Level1BranchNode({
  node,
  direction,
  branchColor,
  collapsedMap,
  toggleCollapse,
  onCopy,
  searchQuery,
  showVietnamese,
  registerAnchor,
}: {
  node: MindmapNode;
  direction: 'left' | 'right';
  branchColor: string;
  collapsedMap: Record<string, boolean>;
  toggleCollapse: (id: string) => void;
  onCopy: (text: string) => void;
  searchQuery: string;
  showVietnamese: boolean;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  const isRight = direction === 'right';
  const isCollapsed = collapsedMap[node.id] ?? false;
  const hasChildren = !!node.children && node.children.length > 0;

  return (
    <div className={`relative flex items-center gap-12 ${isRight ? 'flex-row' : 'flex-row-reverse'}`}>
      <Level1Card
        node={node}
        direction={direction}
        branchColor={branchColor}
        isCollapsed={isCollapsed}
        hasChildren={hasChildren}
        onToggleCollapse={() => toggleCollapse(node.id)}
        searchQuery={searchQuery}
        showVietnamese={showVietnamese}
        registerAnchor={registerAnchor}
      />

      {hasChildren && !isCollapsed && (
        <div className={`flex flex-col justify-center gap-6 ${isRight ? 'items-start' : 'items-end'}`}>
          {node.children!.map((child) => {
            const childCollapsed = collapsedMap[child.id] ?? false;
            const hasItems = !!child.items && child.items.length > 0;

            return (
              <div
                key={child.id}
                className={`relative flex items-center gap-10 ${isRight ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <UnderlinedNode
                  id={child.id}
                  text={child.title}
                  viText={child.viTitle}
                  direction={direction}
                  branchColor={branchColor}
                  hasChildren={hasItems}
                  isCollapsed={childCollapsed}
                  onToggleCollapse={() => toggleCollapse(child.id)}
                  onCopy={onCopy}
                  searchQuery={searchQuery}
                  showVietnamese={showVietnamese}
                  registerAnchor={registerAnchor}
                />

                {hasItems && !childCollapsed && (
                  <div className={`flex flex-col justify-center gap-3 ${isRight ? 'items-start' : 'items-end'}`}>
                    {child.items!.map((item, idx) => {
                      const itemText = typeof item === 'string' ? item : item.text;
                      const itemVi = typeof item === 'string' ? undefined : item.viText;
                      const itemId = `${child.id}-item-${idx}`;

                      return (
                        <UnderlinedNode
                          key={itemId}
                          id={itemId}
                          text={itemText}
                          viText={itemVi}
                          direction={direction}
                          branchColor={branchColor}
                          onCopy={onCopy}
                          searchQuery={searchQuery}
                          showVietnamese={showVietnamese}
                          registerAnchor={registerAnchor}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getConnectionsForTopic(
  topic: MindmapTopic,
  collapsedMap: Record<string, boolean>
) {
  const connections: {
    fromId: string;
    toId: string;
    dir: 'left' | 'right';
    color: string;
  }[] = [];

  for (const branch of topic.leftBranches) {
    const branchColor = branch.color || '#245b86';
    connections.push({
      fromId: 'root-left',
      toId: branch.id,
      dir: 'left',
      color: branchColor,
    });

    if (!collapsedMap[branch.id] && branch.children) {
      for (const child of branch.children) {
        connections.push({
          fromId: branch.id,
          toId: child.id,
          dir: 'left',
          color: branchColor,
        });

        if (!collapsedMap[child.id] && child.items) {
          child.items.forEach((_, idx) => {
            connections.push({
              fromId: child.id,
              toId: `${child.id}-item-${idx}`,
              dir: 'left',
              color: branchColor,
            });
          });
        }
      }
    }
  }

  for (const branch of topic.rightBranches) {
    const branchColor = branch.color || '#0284c7';
    connections.push({
      fromId: 'root-right',
      toId: branch.id,
      dir: 'right',
      color: branchColor,
    });

    if (!collapsedMap[branch.id] && branch.children) {
      for (const child of branch.children) {
        connections.push({
          fromId: branch.id,
          toId: child.id,
          dir: 'right',
          color: branchColor,
        });

        if (!collapsedMap[child.id] && child.items) {
          child.items.forEach((_, idx) => {
            connections.push({
              fromId: child.id,
              toId: `${child.id}-item-${idx}`,
              dir: 'right',
              color: branchColor,
            });
          });
        }
      }
    }
  }

  return connections;
}

// =========================================================================
// MAIN PAGE COMPONENT (UNIFIED HEADER & LAYOUT WITH /prompts & /speaking)
// =========================================================================
export default function Mindmap() {
  const [activeTopicId, setActiveTopicId] = useState<MindmapTopic['id']>('education');
  const [viewMode, setViewMode] = useState<'mindmap' | 'outline'>('outline');
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(0.85);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTopic = params.get('topic') as MindmapTopic['id'] | null;
      const urlView = params.get('view') as 'mindmap' | 'outline' | null;
      const storedTopic = localStorage.getItem('vstep_mindmap_active_topic') as MindmapTopic['id'] | null;
      const validIds = MINDMAP_TOPICS.map((t) => t.id);

      if (urlView === 'outline' || urlView === 'mindmap') {
        setViewMode(urlView);
      }

      const resolved =
        urlTopic && validIds.includes(urlTopic)
          ? urlTopic
          : storedTopic && validIds.includes(storedTopic)
            ? storedTopic
            : null;

      if (resolved) {
        setActiveTopicId(resolved);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const selectTopic = useCallback(
    (topicId: MindmapTopic['id']) => {
      setActiveTopicId(topicId);
      try {
        localStorage.setItem('vstep_mindmap_active_topic', topicId);
        window.history.replaceState(null, '', `?topic=${topicId}&view=${viewMode}`);
      } catch {
        // Ignore storage errors
      }
    },
    [viewMode]
  );

  const switchViewMode = (mode: 'mindmap' | 'outline') => {
    setViewMode(mode);
    try {
      window.history.replaceState(null, '', `?topic=${activeTopicId}&view=${mode}`);
    } catch {
      // Ignore storage errors
    }
  };

  // Mindmap Canvas state
  const [paths, setPaths] = useState<PathEdge[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const anchorsRef = useRef<Map<string, HTMLElement>>(new Map());
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const activeTopic = useMemo(
    () => MINDMAP_TOPICS.find((t) => t.id === activeTopicId) || MINDMAP_TOPICS[0],
    [activeTopicId]
  );

  const totalTopicsCount = useMemo(
    () =>
      MINDMAP_TOPICS.reduce(
        (acc, t) =>
          acc +
          [...t.leftBranches, ...t.rightBranches].reduce(
            (bAcc, b) => bAcc + (b.children?.length || 0),
            0
          ),
        0
      ),
    []
  );

  const registerAnchor = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      anchorsRef.current.set(id, el);
    } else {
      anchorsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  }, []);

  const handleCopy = useCallback(
    (text: string) => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
        showToast('Đã sao chép vào clipboard!');
      }
    },
    [showToast]
  );

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const expandAll = useCallback(() => setCollapsedMap({}), []);

  const collapseAll = useCallback(() => {
    const newMap: Record<string, boolean> = {};
    const traverse = (node: MindmapNode) => {
      if (node.children && node.children.length > 0) {
        newMap[node.id] = true;
        node.children.forEach(traverse);
      }
    };
    activeTopic.rightBranches.forEach(traverse);
    activeTopic.leftBranches.forEach(traverse);
    setCollapsedMap(newMap);
  }, [activeTopic]);

  const centerCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.scrollTo({
      left: Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2),
      top: Math.max(0, (canvas.scrollHeight - canvas.clientHeight) / 2),
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (viewMode === 'mindmap') {
      const timer = setTimeout(centerCanvas, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTopicId, viewMode, centerCanvas]);

  const calculatePaths = useCallback(() => {
    if (viewMode !== 'mindmap' || !treeContainerRef.current) return;
    const containerRect = treeContainerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    const currentZoom = zoomRef.current;
    const connections = getConnectionsForTopic(activeTopic, collapsedMap);
    const newPaths: PathEdge[] = [];

    for (const conn of connections) {
      const fromEl = anchorsRef.current.get(conn.fromId);
      const toEl = anchorsRef.current.get(conn.toId);
      if (!fromEl || !toEl) continue;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const startX =
        conn.dir === 'right'
          ? (fromRect.right - containerRect.left) / currentZoom
          : (fromRect.left - containerRect.left) / currentZoom;
      const startY = (fromRect.top + fromRect.height / 2 - containerRect.top) / currentZoom;
      const endX =
        conn.dir === 'right'
          ? (toRect.left - containerRect.left) / currentZoom
          : (toRect.right - containerRect.left) / currentZoom;
      const endY = (toRect.top + toRect.height / 2 - containerRect.top) / currentZoom;

      const dx = Math.abs(endX - startX);
      const cx1 = conn.dir === 'right' ? startX + dx * 0.5 : startX - dx * 0.5;
      const cx2 = conn.dir === 'right' ? endX - dx * 0.5 : endX + dx * 0.5;

      newPaths.push({
        id: `${conn.fromId}->${conn.toId}`,
        d: `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cx1.toFixed(1)} ${startY.toFixed(1)}, ${cx2.toFixed(1)} ${endY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`,
        color: conn.color,
      });
    }

    setPaths(newPaths);
  }, [activeTopic, collapsedMap, viewMode]);

  useEffect(() => {
    if (viewMode !== 'mindmap') return;
    const handleRecalc = () => requestAnimationFrame(calculatePaths);
    handleRecalc();
    const timer = setTimeout(handleRecalc, 120);

    if (treeContainerRef.current) {
      const ro = new ResizeObserver(handleRecalc);
      ro.observe(treeContainerRef.current);
      return () => {
        clearTimeout(timer);
        ro.disconnect();
      };
    }
    return () => clearTimeout(timer);
  }, [activeTopicId, collapsedMap, searchQuery, calculatePaths, zoom, viewMode, showVietnamese]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'mindmap' || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) return;
    isDraggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasRef.current?.scrollLeft || 0,
      scrollTop: canvasRef.current?.scrollTop || 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    e.preventDefault();
    canvasRef.current.scrollLeft = startPosRef.current.scrollLeft - (e.clientX - startPosRef.current.x);
    canvasRef.current.scrollTop = startPosRef.current.scrollTop - (e.clientY - startPosRef.current.y);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="h-3.5 w-3.5 shrink-0" />;
      case 'Trees':
        return <Trees className="h-3.5 w-3.5 shrink-0" />;
      case 'HeartPulse':
        return <HeartPulse className="h-3.5 w-3.5 shrink-0" />;
      case 'Laptop':
        return <Cpu className="h-3.5 w-3.5 shrink-0" />;
      case 'Briefcase':
        return <Briefcase className="h-3.5 w-3.5 shrink-0" />;
      case 'Users':
        return <Users className="h-3.5 w-3.5 shrink-0" />;
      default:
        return <Lightbulb className="h-3.5 w-3.5 shrink-0" />;
    }
  };

  return (
    <div className="flex w-full max-w-full flex-col space-y-2.5 animate-fade-in pb-12 sm:pb-6 px-1.5 sm:px-3 lg:px-5 select-text">
      {/* 1. Header chuẩn đồng bộ 100% với /prompts và /speaking (bg-[#245b86] h-9) */}
      <header className="flex h-9 items-center justify-between rounded-sm bg-[#245b86] px-3 text-white shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold sm:text-sm">
          <Compass className="h-4 w-4" />
          <span>VSTEP Sơ Đồ Ý Tưởng & Từ Vựng</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
            {totalTopicsCount} chủ đề
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Bật / Tắt dịch tiếng Việt */}
          <button
            type="button"
            onClick={() => setShowVietnamese((v) => !v)}
            className={`flex h-7 items-center gap-1 rounded-xs border px-2 text-xs font-medium transition cursor-pointer ${showVietnamese
                ? 'border-amber-300 bg-amber-400/25 text-amber-200 hover:bg-amber-400/35'
                : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
              }`}
            title={showVietnamese ? 'Ẩn dịch tiếng Việt' : 'Hiện dịch tiếng Việt'}
          >
            {showVietnamese ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Dịch Việt</span>
          </button>

          {/* Chuyển đổi Trang văn bản 2 cột vs Sơ đồ nhánh */}
          <button
            type="button"
            onClick={() => switchViewMode(viewMode === 'outline' ? 'mindmap' : 'outline')}
            className="flex h-7 items-center gap-1.5 rounded-xs border border-white/30 bg-white/10 px-2.5 text-xs font-bold text-white transition hover:bg-white/20 cursor-pointer"
          >
            {viewMode === 'outline' ? (
              <>
                <Compass className="h-3.5 w-3.5" />
                <span>Xem Sơ đồ nhánh</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span>Xem Trang văn bản</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Content: 2-Column Outline View (Default) OR Mindmap Canvas */}
      {viewMode === 'outline' ? (
        <OutlineDocumentView
          topics={MINDMAP_TOPICS}
          activeTopicId={activeTopicId}
          onSelectTopic={selectTopic}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showVietnamese={showVietnamese}
          onCopy={handleCopy}
          getTopicIcon={getTopicIcon}
        />
      ) : (
        <div className="space-y-2.5">
          {/* Mindmap Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-card px-3 py-2 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {MINDMAP_TOPICS.map((t) => {
                const active = t.id === activeTopicId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTopic(t.id)}
                    className={`flex h-7 items-center gap-1.5 rounded-xs px-2.5 text-xs font-bold transition cursor-pointer ${active
                        ? 'bg-[#245b86] text-white'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    {getTopicIcon(t.icon)}
                    <span>{t.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="grid h-7 w-7 place-items-center rounded-xs border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.85)}
                className="px-2 text-xs font-bold text-foreground cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.1).toFixed(2))))}
                className="grid h-7 w-7 place-items-center rounded-xs border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={centerCanvas}
                className="grid h-7 w-7 place-items-center rounded-xs border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer"
                title="Căn giữa"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={Object.keys(collapsedMap).length > 0 ? expandAll : collapseAll}
                className="flex h-7 items-center gap-1 rounded-xs border border-border bg-background px-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <FolderTree className="h-3.5 w-3.5" />
                <span>{Object.keys(collapsedMap).length > 0 ? 'Mở rộng' : 'Thu gọn'}</span>
              </button>
            </div>
          </div>

          {/* Mindmap Canvas */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative h-[calc(100vh-9.5rem)] w-full cursor-grab overflow-auto rounded-sm border border-border bg-card active:cursor-grabbing [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px]"
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="inline-flex min-h-full min-w-full items-center justify-center p-16"
            >
              <div
                ref={treeContainerRef}
                className="relative inline-flex items-center justify-center min-w-max p-16 gap-16"
              >
                <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0">
                  {paths.map((p) => (
                    <path
                      key={p.id}
                      d={p.d}
                      stroke={p.color}
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>

                <div className="relative z-10 flex flex-col justify-center gap-12 items-end">
                  {activeTopic.leftBranches.map((branch) => (
                    <Level1BranchNode
                      key={branch.id}
                      node={branch}
                      direction="left"
                      branchColor={branch.color || '#245b86'}
                      collapsedMap={collapsedMap}
                      toggleCollapse={toggleCollapse}
                      onCopy={handleCopy}
                      searchQuery={searchQuery}
                      showVietnamese={showVietnamese}
                      registerAnchor={registerAnchor}
                    />
                  ))}
                </div>

                <div className="relative z-20 shrink-0">
                  <RootCard node={activeTopic.centerNode} registerAnchor={registerAnchor} />
                </div>

                <div className="relative z-10 flex flex-col justify-center gap-12 items-start">
                  {activeTopic.rightBranches.map((branch) => (
                    <Level1BranchNode
                      key={branch.id}
                      node={branch}
                      direction="right"
                      branchColor={branch.color || '#0284c7'}
                      collapsedMap={collapsedMap}
                      toggleCollapse={toggleCollapse}
                      onCopy={handleCopy}
                      searchQuery={searchQuery}
                      showVietnamese={showVietnamese}
                      registerAnchor={registerAnchor}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-xs border border-border bg-card/90 px-2.5 py-1 text-[11px] text-muted-foreground shadow-2xs">
              <Move className="h-3.5 w-3.5 text-primary" />
              <span>Kéo chuột để di chuyển • Bấm vào câu để chép</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-sm border border-border bg-[#245b86] px-3.5 py-2 text-xs font-bold text-white shadow-lg">
          <Check className="h-3.5 w-3.5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
