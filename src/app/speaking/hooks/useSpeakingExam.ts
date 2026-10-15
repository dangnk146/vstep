'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import { EXAM_PROMPTS, toPromptEditorHtml, type ExamPrompt } from '@/utils/examPrompts';
import {
  ACTIVE_EXAM_KEY,
  ACTIVE_PART_KEY,
  CUSTOM_EXAM_KEY,
  type SpeakingPart,
} from '../types';
import { sanitizeClipboardHtml } from '../utils/sanitize';

function findPromptByIdOrPartial(id: string, preferredPart?: SpeakingPart): ExamPrompt | undefined {
  const trimmed = id.trim();
  if (!trimmed) return undefined;

  // 1. Exact ID match
  const exact = EXAM_PROMPTS.find((p) => p.id === trimmed);
  if (exact) return exact;

  // 2. Short ID match with preferred part (e.g. "30" -> "speaking-part1-30")
  if (preferredPart) {
    const candidate = EXAM_PROMPTS.find((p) => (
      p.category === `speaking-${preferredPart}`
      && (p.id === `speaking-${preferredPart}-${trimmed}` || p.id.endsWith(`-${trimmed}`))
    ));
    if (candidate) return candidate;
  }

  // 3. Fallback partial match
  return EXAM_PROMPTS.find((p) => (
    p.category.startsWith('speaking-')
    && (p.id.endsWith(`-${trimmed}`) || p.setId === trimmed)
  ));
}

function renderSpeakingPromptsHtml(prompts: ExamPrompt[]): string {
  if (prompts.length === 1) {
    return toPromptEditorHtml(prompts[0]);
  }

  return prompts
    .map((prompt, index) => {
      const html = toPromptEditorHtml(prompt);
      return `
        <div class="speaking-part1-topic">
          <div style="font-size: 13px; font-weight: 800; color: #2563eb; margin-bottom: 6px;">TOPIC ${index + 1}</div>
          ${html}
        </div>
      `;
    })
    .join('<hr style="margin: 18px 0; border: none; border-top: 1px dashed var(--border, #cbd5e1);" />');
}

export function useSpeakingExam() {
  const [activePart, setActivePart] = useState<SpeakingPart>('part1');
  const [examHtml, setExamHtml] = useState<string>('');
  const [examKey, setExamKey] = useState<number>(1);
  const [hasExamContent, setHasExamContent] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const syncFromLocation = useCallback((consumeStoredPrompt: boolean) => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1] as SpeakingPart | undefined;
    const queryPart = params.get('part') as SpeakingPart | null;
    const savedPart = localStorage.getItem(ACTIVE_PART_KEY) as SpeakingPart | null;
    const rawExam = params.get('exam')?.trim();

    const fallbackPart: SpeakingPart = pathPart
      || (queryPart === 'part1' || queryPart === 'part2' || queryPart === 'part3' ? queryPart : null)
      || (savedPart === 'part1' || savedPart === 'part2' || savedPart === 'part3' ? savedPart : null)
      || 'part1';

    let matchedPrompts: ExamPrompt[] = [];

    // 1. Parse requested exams from URL query (?exam=id1+id2 or ?exam=id1)
    if (rawExam) {
      const ids = rawExam.split(/[\s+,]+/).map((s) => s.trim()).filter(Boolean);
      const seenIds = new Set<string>();

      ids.forEach((id) => {
        const found = findPromptByIdOrPartial(id, fallbackPart);
        if (found && !seenIds.has(found.id)) {
          seenIds.add(found.id);
          matchedPrompts.push(found);
        }
      });
    }

    // 2. Determine active part from matched prompts or URL path
    let part: SpeakingPart = fallbackPart;
    if (matchedPrompts.length > 0) {
      part = matchedPrompts[0].category.replace('speaking-', '') as SpeakingPart;
    }

    // 3. For Part 1: if only 1 topic was provided, pair with a second distinct topic
    if (part === 'part1' && matchedPrompts.length === 1 && matchedPrompts[0].category === 'speaking-part1') {
      const firstPrompt = matchedPrompts[0];
      const part1Pool = EXAM_PROMPTS.filter((p) => p.category === 'speaking-part1' && p.id !== firstPrompt.id);
      if (part1Pool.length > 0) {
        const secondPrompt = part1Pool[Math.floor(Math.random() * part1Pool.length)];
        matchedPrompts.push(secondPrompt);
      }
    }

    let promptHtml: string | null = null;
    let selectedExamId: string | undefined;

    if (matchedPrompts.length > 0) {
      promptHtml = renderSpeakingPromptsHtml(matchedPrompts);
      selectedExamId = matchedPrompts.map((p) => p.id).join('+');
    } else if (consumeStoredPrompt) {
      const savedExamId = localStorage.getItem(ACTIVE_EXAM_KEY);
      if (savedExamId) {
        const storedIds = savedExamId.split(/[\s+,]+/).map((s) => s.trim()).filter(Boolean);
        const storedPrompts = storedIds
          .map((id) => findPromptByIdOrPartial(id, part))
          .filter((p): p is ExamPrompt => Boolean(p && p.category === `speaking-${part}`));

        if (storedPrompts.length > 0) {
          if (part === 'part1' && storedPrompts.length === 1) {
            const first = storedPrompts[0];
            const pool = EXAM_PROMPTS.filter((p) => p.category === 'speaking-part1' && p.id !== first.id);
            if (pool.length > 0) {
              storedPrompts.push(pool[Math.floor(Math.random() * pool.length)]);
            }
          }
          matchedPrompts = storedPrompts;
          promptHtml = renderSpeakingPromptsHtml(matchedPrompts);
          selectedExamId = matchedPrompts.map((p) => p.id).join('+');
        }
      }

      if (!promptHtml) {
        const customExam = localStorage.getItem(CUSTOM_EXAM_KEY) || '';
        if (customExam.trim()) {
          promptHtml = customExam;
        }
      }
    }

    const sanitizedContent = promptHtml ? sanitizeClipboardHtml(promptHtml) : '';

    startTransition(() => {
      setActivePart(part);
      setExamHtml(sanitizedContent);
      setExamKey((previous) => previous + 1);
      setHasExamContent(Boolean(sanitizedContent.trim()));
      setIsSubmitted(false);
      localStorage.setItem(ACTIVE_PART_KEY, part);

      if (selectedExamId && promptHtml) {
        localStorage.setItem(CUSTOM_EXAM_KEY, promptHtml);
        localStorage.setItem(ACTIVE_EXAM_KEY, selectedExamId);
      } else if (!promptHtml) {
        localStorage.removeItem(ACTIVE_EXAM_KEY);
      }
    });

    const canonicalUrl = `/speaking/${part}${selectedExamId ? `?exam=${selectedExamId}` : ''}`;
    if (`${window.location.pathname}${window.location.search}` !== canonicalUrl) {
      window.history.replaceState(null, '', canonicalUrl);
    }
  }, []);

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    syncFromLocation(true);
    const handlePopState = () => syncFromLocation(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncFromLocation]);

  // Listen to section switch from sidebar
  useEffect(() => {
    const handleSectionSelect = (event: Event) => {
      const { skill, section } = (event as CustomEvent<{ skill: string; section: string }>).detail;
      if (skill !== 'speaking' || (section !== 'part1' && section !== 'part2' && section !== 'part3')) return;
      setActivePart(section);
      setIsSubmitted(false);
      localStorage.setItem(ACTIVE_PART_KEY, section);
      localStorage.removeItem(ACTIVE_EXAM_KEY);
      localStorage.removeItem(CUSTOM_EXAM_KEY);
      setExamHtml('');
      setExamKey((previous) => previous + 1);
      setHasExamContent(false);
    };

    window.addEventListener('vstep:select-section', handleSectionSelect);
    return () => window.removeEventListener('vstep:select-section', handleSectionSelect);
  }, []);

  // Handle get random prompt
  const handleRandomPrompt = () => {
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1] as SpeakingPart | undefined;
    const selectedPart: SpeakingPart = pathPart === 'part1' || pathPart === 'part2' || pathPart === 'part3'
      ? pathPart
      : activePart;

    // Special logic for Part 1: Select 2 distinct topics
    if (selectedPart === 'part1') {
      const prompts = EXAM_PROMPTS.filter((prompt) => prompt.category === 'speaking-part1');
      if (prompts.length < 2) return;

      const currentIds = (localStorage.getItem(ACTIVE_EXAM_KEY) || '').split(/[\s+,]+/);
      const available = prompts.filter((p) => !currentIds.includes(p.id));
      const pool1 = available.length > 0 ? available : prompts;
      const prompt1 = pool1[Math.floor(Math.random() * pool1.length)];

      const pool2 = prompts.filter((p) => p.id !== prompt1.id && !currentIds.includes(p.id));
      const pool2Fallback = prompts.filter((p) => p.id !== prompt1.id);
      const pool2Final = pool2.length > 0 ? pool2 : pool2Fallback;
      const prompt2 = pool2Final[Math.floor(Math.random() * pool2Final.length)];

      const combinedId = `${prompt1.id}+${prompt2.id}`;
      const content = renderSpeakingPromptsHtml([prompt1, prompt2]);
      const sanitizedContent = sanitizeClipboardHtml(content);

      setExamHtml(sanitizedContent);
      setExamKey((previous) => previous + 1);
      setHasExamContent(true);
      setIsSubmitted(false);

      localStorage.setItem(CUSTOM_EXAM_KEY, content);
      localStorage.setItem(ACTIVE_EXAM_KEY, combinedId);
      setActivePart('part1');
      localStorage.setItem(ACTIVE_PART_KEY, 'part1');

      window.history.pushState(
        null,
        '',
        `/speaking/part1?exam=${combinedId}`,
      );
      return;
    }

    // Logic for Part 2 & Part 3: Select 1 prompt
    const prompts = EXAM_PROMPTS.filter((prompt) => prompt.category === `speaking-${selectedPart}`);
    if (prompts.length === 0) return;

    const currentExamId = localStorage.getItem(ACTIVE_EXAM_KEY);
    const available = prompts.filter((p) => p.id !== currentExamId);
    const pool = available.length > 0 ? available : prompts;
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    if (!prompt) return;

    const content = renderSpeakingPromptsHtml([prompt]);
    const sanitizedContent = sanitizeClipboardHtml(content);

    setExamHtml(sanitizedContent);
    setExamKey((previous) => previous + 1);
    setHasExamContent(true);
    setIsSubmitted(false);

    localStorage.setItem(CUSTOM_EXAM_KEY, content);
    localStorage.setItem(ACTIVE_EXAM_KEY, prompt.id);

    const part = prompt.category.replace('speaking-', '') as SpeakingPart;
    setActivePart(part);
    localStorage.setItem(ACTIVE_PART_KEY, part);

    window.history.pushState(
      null,
      '',
      `/speaking/${part}?exam=${prompt.id}`,
    );
  };

  const handleEditorInput = (html: string, text: string) => {
    localStorage.setItem(CUSTOM_EXAM_KEY, html);
    localStorage.removeItem(ACTIVE_EXAM_KEY);

    const params = new URLSearchParams(window.location.search);
    if (params.has('exam')) {
      params.delete('exam');
      const query = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`,
      );
    }
    setHasExamContent(Boolean(text.trim()));
    setIsSubmitted(false);
  };

  return {
    activePart,
    examHtml,
    examKey,
    hasExamContent,
    isSubmitted,
    setActivePart,
    setIsSubmitted,
    setExamHtml,
    setExamKey,
    setHasExamContent,
    handleRandomPrompt,
    handleEditorInput,
  };
}
