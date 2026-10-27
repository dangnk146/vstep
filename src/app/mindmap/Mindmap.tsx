'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  GraduationCap,
  Trees,
  HeartPulse,
  Cpu,
  Car,
  Briefcase,
  Compass,
  Users,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  FolderTree,
  Move,
  Lightbulb,
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
      <mark className="rounded bg-amber-300 px-1 py-0.5 font-bold text-amber-950 dark:bg-amber-400 dark:text-amber-950">
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
  if (node.badge?.toLowerCase().includes(q)) return true;
  if (node.tags?.some((t) => t.toLowerCase().includes(q))) return true;
  if (node.items?.some((item) => (typeof item === 'string' ? item : item.text).toLowerCase().includes(q))) {
    return true;
  }
  return !!node.children?.some((child) => nodeMatchesQuery(child, query));
}

// Root Center Card
function RootCard({
  node,
  registerAnchor,
}: {
  node: MindmapTopic['centerNode'];
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  return (
    <div
      ref={(el) => registerAnchor('root', el)}
      className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-primary/40 bg-card/95 px-8 py-5 text-center shadow-2xl backdrop-blur-md ring-4 ring-primary/10 transition-transform duration-300 hover:scale-105 select-none min-w-[220px]"
    >
      <span className="rounded-full bg-primary/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
        {node.categoryBadge}
      </span>
      <h1 className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl drop-shadow-xs">
        {node.title}
      </h1>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">
        {node.subtitle}
      </p>

      {/* Anchor targets on left and right edges */}
      <div
        ref={(el) => registerAnchor('root-left', el)}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none"
      />
      <div
        ref={(el) => registerAnchor('root-right', el)}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none"
      />
    </div>
  );
}

// Level 1: Category / Parent Node (Rounded Card with border matching branch color and chips below)
function Level1Card({
  node,
  direction,
  branchColor,
  isCollapsed,
  hasChildren,
  onToggleCollapse,
  searchQuery,
  registerAnchor,
}: {
  node: MindmapNode;
  direction: 'left' | 'right';
  branchColor: string;
  isCollapsed: boolean;
  hasChildren: boolean;
  onToggleCollapse: () => void;
  searchQuery: string;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  const isRight = direction === 'right';
  const isMatched = searchQuery && nodeMatchesQuery(node, searchQuery);

  return (
    <div
      ref={(el) => registerAnchor(node.id, el)}
      style={{
        borderColor: branchColor,
      }}
      className={`group relative z-10 flex min-w-[210px] max-w-[290px] flex-col rounded-2xl border-2 bg-card/95 p-3.5 shadow-md backdrop-blur transition-all duration-200 hover:shadow-lg ${
        isRight ? 'text-left' : 'text-right'
      } ${isMatched ? 'ring-3 ring-amber-400 dark:ring-amber-300 shadow-xl' : ''}`}
    >
      {/* Top Header Row: Title & Collapse Button */}
      <div
        className={`flex items-center justify-between gap-2.5 ${
          isRight ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <h3 className="text-sm font-black tracking-tight text-foreground">
          <HighlightText text={node.title} query={searchQuery} />
        </h3>

        {hasChildren && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-white font-bold text-xs shadow-xs transition-transform duration-150 active:scale-95 cursor-pointer"
            style={{ backgroundColor: branchColor }}
            title={isCollapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}
          >
            {isCollapsed ? '+' : '−'}
          </button>
        )}
      </div>

      {/* Sub-tags / Chips Row underneath */}
      {node.tags && node.tags.length > 0 && (
        <div
          className={`mt-2 flex flex-wrap gap-1.5 ${
            isRight ? 'justify-start' : 'justify-end'
          }`}
        >
          {node.tags.map((tag, idx) => (
            <span
              key={idx}
              className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
              style={{
                backgroundColor: `${branchColor}18`,
                color: branchColor,
                border: `1px solid ${branchColor}35`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Level 2+ Leaf Node: "Underlined Node / Branch as Baseline"
// NO box, NO card background, NO rectangle border!
// The text floats on top of the branch line; the line width fits the text width exactly.
function UnderlinedNode({
  id,
  text,
  direction,
  branchColor,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  onCopy,
  searchQuery,
  badge,
  registerAnchor,
}: {
  id: string;
  text: string;
  direction: 'left' | 'right';
  branchColor: string;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCopy: (text: string) => void;
  searchQuery: string;
  badge?: string;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  const isRight = direction === 'right';
  const isMatched = searchQuery && text.toLowerCase().includes(searchQuery.toLowerCase());
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      onClick={handleCopy}
      className={`group relative inline-flex flex-col cursor-pointer transition-all ${
        isRight ? 'items-start text-left' : 'items-end text-right'
      } ${searchQuery && !isMatched ? 'opacity-35' : 'opacity-100'}`}
      title="Bấm để sao chép từ vựng"
    >
      {/* Floating Text on top of baseline */}
      <div
        className={`flex items-baseline gap-2 pb-1 select-text ${
          isRight ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        {badge && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: `${branchColor}20`,
              color: branchColor,
            }}
          >
            {badge}
          </span>
        )}

        <span
          className={`text-[13px] leading-relaxed font-semibold transition-colors ${
            isMatched
              ? 'text-amber-600 dark:text-amber-300 font-bold'
              : 'text-foreground/90 group-hover:text-foreground'
          }`}
        >
          <HighlightText text={text} query={searchQuery} />
        </span>

        {/* Copy confirmation icon */}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0">
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </span>

        {/* Sub-branch collapse toggle */}
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-white font-bold text-[10px] shadow-xs cursor-pointer"
            style={{ backgroundColor: branchColor }}
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? '+' : '−'}
          </button>
        )}
      </div>

      {/* Horizontal Baseline Underline (length matches text width exactly!) */}
      <div
        ref={(el) => registerAnchor(id, el)}
        className="h-[2.5px] w-full rounded-full transition-all group-hover:h-[3.5px]"
        style={{
          backgroundColor: branchColor,
          boxShadow: `0 1px 4px ${branchColor}40`,
        }}
      />
    </div>
  );
}

// Level 1 Branch Node with its Level 2 and Level 3 children
function Level1BranchNode({
  node,
  direction,
  branchColor,
  collapsedMap,
  toggleCollapse,
  onCopy,
  searchQuery,
  registerAnchor,
}: {
  node: MindmapNode;
  direction: 'left' | 'right';
  branchColor: string;
  collapsedMap: Record<string, boolean>;
  toggleCollapse: (id: string) => void;
  onCopy: (text: string) => void;
  searchQuery: string;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
}) {
  const isRight = direction === 'right';
  const isCollapsed = collapsedMap[node.id] ?? false;
  const hasChildren = !!node.children && node.children.length > 0;

  return (
    <div
      className={`relative flex items-center gap-14 ${
        isRight ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      {/* Level 1 Rounded Card */}
      <Level1Card
        node={node}
        direction={direction}
        branchColor={branchColor}
        isCollapsed={isCollapsed}
        hasChildren={hasChildren}
        onToggleCollapse={() => toggleCollapse(node.id)}
        searchQuery={searchQuery}
        registerAnchor={registerAnchor}
      />

      {/* Children Column (Level 2) */}
      {hasChildren && !isCollapsed && (
        <div
          className={`flex flex-col justify-center gap-8 ${
            isRight ? 'items-start' : 'items-end'
          }`}
        >
          {node.children!.map((child) => {
            const childCollapsed = collapsedMap[child.id] ?? false;
            const hasItems = !!child.items && child.items.length > 0;

            return (
              <div
                key={child.id}
                className={`relative flex items-center gap-12 ${
                  isRight ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Level 2 Underlined Node */}
                <UnderlinedNode
                  id={child.id}
                  text={child.title}
                  direction={direction}
                  branchColor={branchColor}
                  hasChildren={hasItems}
                  isCollapsed={childCollapsed}
                  onToggleCollapse={() => toggleCollapse(child.id)}
                  onCopy={onCopy}
                  searchQuery={searchQuery}
                  registerAnchor={registerAnchor}
                />

                {/* Level 3 Column (Leaf items) */}
                {hasItems && !childCollapsed && (
                  <div
                    className={`flex flex-col justify-center gap-4 ${
                      isRight ? 'items-start' : 'items-end'
                    }`}
                  >
                    {child.items!.map((item, idx) => {
                      const itemText = typeof item === 'string' ? item : item.text;
                      const itemId = `${child.id}-item-${idx}`;

                      return (
                        <UnderlinedNode
                          key={itemId}
                          id={itemId}
                          text={itemText}
                          direction={direction}
                          branchColor={branchColor}
                          onCopy={onCopy}
                          searchQuery={searchQuery}
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

// Generate all graph connections
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

  // Left branches
  for (const branch of topic.leftBranches) {
    const branchColor = branch.color || '#f97316';
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
            const itemId = `${child.id}-item-${idx}`;
            connections.push({
              fromId: child.id,
              toId: itemId,
              dir: 'left',
              color: branchColor,
            });
          });
        }
      }
    }
  }

  // Right branches
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
            const itemId = `${child.id}-item-${idx}`;
            connections.push({
              fromId: child.id,
              toId: itemId,
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

export default function Mindmap() {
  const [activeTopicId, setActiveTopicId] = useState<MindmapTopic['id']>('education');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(0.85);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Restore saved topic from URL or localStorage on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTopic = params.get('topic') as MindmapTopic['id'] | null;
      const storedTopic = localStorage.getItem('vstep_mindmap_active_topic') as MindmapTopic['id'] | null;
      const validIds = MINDMAP_TOPICS.map((t) => t.id);

      const resolved = (urlTopic && validIds.includes(urlTopic))
        ? urlTopic
        : (storedTopic && validIds.includes(storedTopic))
          ? storedTopic
          : null;

      if (resolved) {
        setActiveTopicId(resolved);
        if (urlTopic !== resolved) {
          window.history.replaceState(null, '', `?topic=${resolved}`);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const selectTopic = useCallback((topicId: MindmapTopic['id']) => {
    setActiveTopicId(topicId);
    setSearchQuery('');
    try {
      localStorage.setItem('vstep_mindmap_active_topic', topicId);
      window.history.replaceState(null, '', `?topic=${topicId}`);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // SVG Cubic Bezier Paths
  const [paths, setPaths] = useState<PathEdge[]>([]);

  // Drag-to-pan state
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Map of anchor elements
  const anchorsRef = useRef<Map<string, HTMLElement>>(new Map());
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const activeTopic = useMemo(
    () => MINDMAP_TOPICS.find((t) => t.id === activeTopicId) || MINDMAP_TOPICS[0],
    [activeTopicId]
  );

  const registerAnchor = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      anchorsRef.current.set(id, el);
    } else {
      anchorsRef.current.delete(id);
    }
  }, []);

  // Toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  const handleCopy = useCallback(
    (text: string) => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
        showToast(`Đã sao chép: "${text.length > 38 ? text.slice(0, 38) + '...' : text}"`);
      }
    },
    [showToast]
  );

  // Collapse / Expand toggle
  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedMap({});
  }, []);

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

  // Center canvas on topic change or initial load
  const centerCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const scrollX = (canvas.scrollWidth - canvas.clientWidth) / 2;
    const scrollY = (canvas.scrollHeight - canvas.clientHeight) / 2;

    canvas.scrollTo({
      left: Math.max(0, scrollX),
      top: Math.max(0, scrollY),
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      centerCanvas();
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTopicId, centerCanvas]);

  // Expand all when user searches
  useEffect(() => {
    if (searchQuery.trim()) {
      setCollapsedMap({});
    }
  }, [searchQuery]);

  // Calculate smooth cubic bezier curves between nodes
  const calculatePaths = useCallback(() => {
    if (!treeContainerRef.current) return;
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

      let startX = 0, startY = 0, endX = 0, endY = 0;

      if (conn.dir === 'right') {
        // Curve leaves from right edge of parent anchor
        startX = (fromRect.right - containerRect.left) / currentZoom;
        startY = (fromRect.top + fromRect.height / 2 - containerRect.top) / currentZoom;
        // Curve enters into left edge of child baseline underline
        endX = (toRect.left - containerRect.left) / currentZoom;
        endY = (toRect.top + toRect.height / 2 - containerRect.top) / currentZoom;
      } else {
        // Curve leaves from left edge of parent anchor
        startX = (fromRect.left - containerRect.left) / currentZoom;
        startY = (fromRect.top + fromRect.height / 2 - containerRect.top) / currentZoom;
        // Curve enters into right edge of child baseline underline
        endX = (toRect.right - containerRect.left) / currentZoom;
        endY = (toRect.top + toRect.height / 2 - containerRect.top) / currentZoom;
      }

      // Smooth horizontal-entry cubic bezier
      const dx = Math.abs(endX - startX);
      const cx1 = conn.dir === 'right' ? startX + dx * 0.5 : startX - dx * 0.5;
      const cy1 = startY;
      const cx2 = conn.dir === 'right' ? endX - dx * 0.5 : endX + dx * 0.5;
      const cy2 = endY;

      const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;

      newPaths.push({
        id: `${conn.fromId}->${conn.toId}`,
        d,
        color: conn.color,
      });
    }

    setPaths(newPaths);
  }, [activeTopic, collapsedMap]);

  // Recalculate paths when layout changes or DOM elements resize
  useEffect(() => {
    const handleRecalc = () => {
      requestAnimationFrame(calculatePaths);
    };

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
  }, [activeTopicId, collapsedMap, searchQuery, calculatePaths, zoom]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('.select-text')) {
      return;
    }

    isDraggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasRef.current?.scrollLeft || 0,
      scrollTop: canvasRef.current?.scrollTop || 0,
    };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
      canvasRef.current.style.userSelect = 'none';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    canvasRef.current.scrollLeft = startPosRef.current.scrollLeft - dx;
    canvasRef.current.scrollTop = startPosRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
      canvasRef.current.style.removeProperty('user-select');
    }
  };

  // Touch pan handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    startPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      scrollLeft: canvasRef.current?.scrollLeft || 0,
      scrollTop: canvasRef.current?.scrollTop || 0,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !canvasRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPosRef.current.x;
    const dy = touch.clientY - startPosRef.current.y;
    canvasRef.current.scrollLeft = startPosRef.current.scrollLeft - dx;
    canvasRef.current.scrollTop = startPosRef.current.scrollTop - dy;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(1.8, Math.max(0.4, Number((prev + delta).toFixed(2)))));
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Topic icon component
  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="h-4 w-4 shrink-0" />;
      case 'Trees':
        return <Trees className="h-4 w-4 shrink-0" />;
      case 'HeartPulse':
        return <HeartPulse className="h-4 w-4 shrink-0" />;
      case 'Cpu':
        return <Cpu className="h-4 w-4 shrink-0" />;
      case 'Car':
        return <Car className="h-4 w-4 shrink-0" />;
      case 'Briefcase':
        return <Briefcase className="h-4 w-4 shrink-0" />;
      case 'Compass':
        return <Compass className="h-4 w-4 shrink-0" />;
      case 'Users':
        return <Users className="h-4 w-4 shrink-0" />;
      default:
        return <Lightbulb className="h-4 w-4 shrink-0" />;
    }
  };

  // Count search matches
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    let count = 0;
    const checkNode = (node: MindmapNode) => {
      const q = searchQuery.toLowerCase();
      if (node.title.toLowerCase().includes(q)) count++;
      node.items?.forEach((it) => {
        if ((typeof it === 'string' ? it : it.text).toLowerCase().includes(q)) count++;
      });
      node.children?.forEach(checkNode);
    };
    activeTopic.rightBranches.forEach(checkNode);
    activeTopic.leftBranches.forEach(checkNode);
    return count;
  }, [activeTopic, searchQuery]);

  return (
    <div
      ref={containerRef}
      className="-mx-1 sm:-mx-3 lg:-mx-4 -mb-28 sm:-mb-24 lg:-mb-20 flex h-[calc(100vh-3.25rem)] w-[calc(100%+0.5rem)] sm:w-[calc(100%+1.5rem)] lg:w-[calc(100%+2rem)] flex-col overflow-hidden bg-background select-none"
    >
      {/* Top Controls Header */}
      <header className="z-30 shrink-0 border-b border-border bg-card/95 px-3 py-2 shadow-xs backdrop-blur sm:px-6 sm:py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Topic Switcher Pills (8 comprehensive topics) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MINDMAP_TOPICS.map((topic) => {
              const active = topic.id === activeTopicId;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => selectTopic(topic.id)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {getTopicIcon(topic.icon)}
                  <span className="whitespace-nowrap">{topic.title}</span>
                </button>
              );
            })}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm từ vựng, ý tưởng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-36 rounded-lg border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 grid h-4 w-4 place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {searchQuery && (
              <span className="hidden text-[11px] font-medium text-amber-600 dark:text-amber-400 sm:inline">
                {matchCount} kết quả
              </span>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.85)}
                className="px-1.5 text-[11px] font-bold text-foreground hover:text-primary cursor-pointer"
                title="Đặt lại zoom mặc định"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.1).toFixed(2))))}
                className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Recenter Canvas */}
            <button
              type="button"
              onClick={centerCanvas}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="Căn giữa sơ đồ"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Expand / Collapse All */}
            <button
              type="button"
              onClick={Object.keys(collapsedMap).length > 0 ? expandAll : collapseAll}
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer md:flex"
              title={Object.keys(collapsedMap).length > 0 ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>{Object.keys(collapsedMap).length > 0 ? 'Mở rộng' : 'Thu gọn'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="relative flex-1 cursor-grab overflow-auto bg-muted/20 active:cursor-grabbing [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px]"
      >
        {/* Mindmap Content Wrapper */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="inline-flex min-h-full min-w-full items-center justify-center p-20 sm:p-28"
        >
          {/* Bi-directional Tree Layout */}
          <div
            ref={treeContainerRef}
            className="relative inline-flex items-center justify-center min-w-max p-20 gap-20"
          >
            {/* Dynamic SVG Bezier Connecting Curves */}
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))' }}
            >
              {paths.map((p) => (
                <path
                  key={p.id}
                  d={p.d}
                  stroke={p.color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>

            {/* LEFT SIDE (Radiating leftwards) */}
            <div className="relative z-10 flex flex-col justify-center gap-14 items-end">
              {activeTopic.leftBranches.map((branch) => (
                <Level1BranchNode
                  key={branch.id}
                  node={branch}
                  direction="left"
                  branchColor={branch.color || '#f97316'}
                  collapsedMap={collapsedMap}
                  toggleCollapse={toggleCollapse}
                  onCopy={handleCopy}
                  searchQuery={searchQuery}
                  registerAnchor={registerAnchor}
                />
              ))}
            </div>

            {/* CENTER ROOT NODE */}
            <div className="relative z-20 shrink-0">
              <RootCard
                node={activeTopic.centerNode}
                registerAnchor={registerAnchor}
              />
            </div>

            {/* RIGHT SIDE (Radiating rightwards) */}
            <div className="relative z-10 flex flex-col justify-center gap-14 items-start">
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
                  registerAnchor={registerAnchor}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floating Quick Navigation Hints */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          <Move className="h-3.5 w-3.5 text-primary" />
          <span>Kéo chuột để di chuyển canvas • Cuộn chuột + Ctrl để phóng to/thu nhỏ • Bấm vào từ vựng để sao chép</span>
        </div>
      </div>

      {/* Floating Copy Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-primary/30 bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
