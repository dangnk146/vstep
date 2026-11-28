'use client';

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { toPromptEditorHtml, type ExamPrompt } from '@/utils/examPrompts';
import {
  ACTIVE_EXAM_KEY,
  ACTIVE_PART_KEY,
  CUSTOM_EXAM_KEY,
  type SpeakingPart,
} from '../types';
import { sanitizeClipboardHtml } from '../utils/sanitize';
import {
  fetchExamPromptsByIds,
  getExamApiSettings,
  getRandomExamPrompts,
  parseExamQueryString,
} from '@/lib/examApi';

function buildSpeakingUrl(part: SpeakingPart, examId?: string): string {
  const cleanExam = examId?.trim();
  return cleanExam
    ? `/speaking/${part}?exam=${encodeURIComponent(cleanExam)}`
    : `/speaking/${part}`;
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
  const [isLoadingRandomPrompt, setIsLoadingRandomPrompt] = useState<boolean>(false);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activePrompts, setActivePrompts] = useState<ExamPrompt[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false);
  const loadedHintExamIdRef = useRef<string>('');

  const syncFromLocation = useCallback((consumeStoredPrompt: boolean) => {
    if (typeof window === 'undefined') return;

    const parsedQuery = parseExamQueryString(window.location.search);
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1] as SpeakingPart | undefined;
    const queryPart = parsedQuery.part as SpeakingPart | null;
    const savedPart = localStorage.getItem(ACTIVE_PART_KEY) as SpeakingPart | null;
    const rawExam = parsedQuery.exam;

    const fallbackPart: SpeakingPart = pathPart
      || (queryPart === 'part1' || queryPart === 'part2' || queryPart === 'part3' ? queryPart : null)
      || (savedPart === 'part1' || savedPart === 'part2' || savedPart === 'part3' ? savedPart : null)
      || 'part1';

    const part = fallbackPart;
    let promptHtml: string | null = null;
    let selectedExamId: string | undefined = rawExam || undefined;

    const savedExamId = localStorage.getItem(ACTIVE_EXAM_KEY);
    const savedExamHtml = localStorage.getItem(CUSTOM_EXAM_KEY);

    const isChangingPart = Boolean(pathPart && savedPart && pathPart !== savedPart);
    if (isChangingPart && !rawExam) {
      localStorage.removeItem(ACTIVE_EXAM_KEY);
      localStorage.removeItem(CUSTOM_EXAM_KEY);
      promptHtml = '';
      selectedExamId = undefined;
    } else if (rawExam) {
      selectedExamId = rawExam;
      if (savedExamId === rawExam && savedExamHtml) {
        promptHtml = savedExamHtml;
      } else {
        promptHtml = null;
      }
    } else if (consumeStoredPrompt && savedExamHtml && (!savedPart || savedPart === part)) {
      promptHtml = savedExamHtml;
      if (savedExamId) selectedExamId = savedExamId;
    } else {
      promptHtml = '';
      selectedExamId = undefined;
    }

    const hasStalePart3Mock =
      part === 'part3' &&
      Boolean(promptHtml) &&
      promptHtml!.includes('speaking-part3-option') &&
      /(?:Fresh air|Lower living costs|Calm lifestyle|Supportive people|Close-knit society)/.test(promptHtml!);

    if (hasStalePart3Mock) {
      promptHtml = null;
    }

    if (promptHtml && !promptHtml.trim()) {
      promptHtml = null;
    }

    const sanitizedContent = promptHtml ? sanitizeClipboardHtml(promptHtml) : '';

    startTransition(() => {
      setActivePart(part);
      setExamHtml(sanitizedContent);
      setExamKey((previous) => previous + 1);
      setHasExamContent(Boolean(sanitizedContent.trim()));
      setIsSubmitted(false);
      localStorage.setItem(ACTIVE_PART_KEY, part);

      setActiveExamId(selectedExamId || null);
      if (selectedExamId && promptHtml) {
        localStorage.setItem(CUSTOM_EXAM_KEY, promptHtml);
        localStorage.setItem(ACTIVE_EXAM_KEY, selectedExamId);
      } else if (!promptHtml && !rawExam) {
        localStorage.removeItem(ACTIVE_EXAM_KEY);
      }
    });

    if (selectedExamId && !sanitizedContent) {
      fetchExamPromptsByIds(selectedExamId, 'speaking')
        .then((found) => {
          if (found.length > 0) {
            const html = renderSpeakingPromptsHtml(found);
            const sanitized = sanitizeClipboardHtml(html);
            startTransition(() => {
              setExamHtml(sanitized);
              setExamKey((prev) => prev + 1);
              setHasExamContent(true);
              setActiveExamId(selectedExamId!);
              loadedHintExamIdRef.current = selectedExamId!;
              setActivePrompts(found);
              localStorage.setItem(CUSTOM_EXAM_KEY, html);
              localStorage.setItem(ACTIVE_EXAM_KEY, selectedExamId!);
            });
          }
        })
        .catch(console.error);
    }

    const canonicalUrl = buildSpeakingUrl(part, selectedExamId);
    if (`${window.location.pathname}${window.location.search}` !== canonicalUrl) {
      window.history.replaceState(null, '', canonicalUrl);
    }
  }, []);

  // Hydrate full prompt objects (with structured `hint`) when restored from localStorage/URL
  useEffect(() => {
    if (!activeExamId) {
      loadedHintExamIdRef.current = '';
      setActivePrompts((prev) => (prev.length === 0 ? prev : []));
      setIsLoadingHint(false);
      return;
    }

    if (loadedHintExamIdRef.current === activeExamId) return;

    let cancelled = false;
    setIsLoadingHint(true);
    fetchExamPromptsByIds(activeExamId, 'speaking')
      .then((found) => {
        if (!cancelled) {
          loadedHintExamIdRef.current = activeExamId;
          setActivePrompts(found);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setIsLoadingHint(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeExamId]);

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
      setActiveExamId(null);
      loadedHintExamIdRef.current = '';
      setActivePrompts([]);
      localStorage.removeItem(ACTIVE_EXAM_KEY);
      localStorage.removeItem(CUSTOM_EXAM_KEY);
      setExamHtml('');
      setExamKey((previous) => previous + 1);
      setHasExamContent(false);

      window.history.replaceState(null, '', buildSpeakingUrl(section));
    };

    window.addEventListener('vstep:select-section', handleSectionSelect);
    return () => window.removeEventListener('vstep:select-section', handleSectionSelect);
  }, []);

  // Handle get random prompt
  const handleRandomPrompt = async () => {
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1] as SpeakingPart | undefined;
    const selectedPart: SpeakingPart = pathPart === 'part1' || pathPart === 'part2' || pathPart === 'part3'
      ? pathPart
      : activePart;

    const apiSettings = getExamApiSettings();
    setIsLoadingRandomPrompt(true);
    try {
      const prompts = await getRandomExamPrompts({
        skill: 'speaking',
        part: selectedPart,
        school: apiSettings.school,
        batch: apiSettings.batch,
        count: selectedPart === 'part1' ? 2 : 1,
      });

      if (!prompts.length) {
        throw new Error('Không có đề Speaking phù hợp với trường, đợt thi và Part đã chọn.');
      }
      const part = prompts[0].category.replace('speaking-', '') as SpeakingPart;
      const content = renderSpeakingPromptsHtml(prompts);
      const examId = prompts.map((prompt) => prompt.id).join('+');
      setExamHtml(sanitizeClipboardHtml(content));
      setExamKey((previous) => previous + 1);
      setHasExamContent(true);
      setIsSubmitted(false);
      setActivePart(part);
      loadedHintExamIdRef.current = examId;
      setActiveExamId(examId);
      setActivePrompts(prompts);
      localStorage.setItem(CUSTOM_EXAM_KEY, content);
      localStorage.setItem(ACTIVE_EXAM_KEY, examId);
      localStorage.setItem(ACTIVE_PART_KEY, part);

      window.history.pushState(null, '', buildSpeakingUrl(part, examId));
    } catch (error) {
      console.error('Could not load a random Speaking prompt.', error);
      window.alert(error instanceof Error ? error.message : 'Không thể tải đề Speaking.');
    } finally {
      setIsLoadingRandomPrompt(false);
    }
  };

  const handleEditorInput = (html: string, text: string) => {
    loadedHintExamIdRef.current = '';
    setActiveExamId(null);
    setActivePrompts([]);
    localStorage.setItem(CUSTOM_EXAM_KEY, html);
    localStorage.removeItem(ACTIVE_EXAM_KEY);

    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setHasExamContent(Boolean(text.trim()));
    setIsSubmitted(false);
  };

  return {
    activePart,
    activeExamId,
    activePrompts,
    isLoadingHint,
    examHtml,
    examKey,
    hasExamContent,
    isSubmitted,
    isLoadingRandomPrompt,
    setActivePart,
    setIsSubmitted,
    setExamHtml,
    setExamKey,
    setHasExamContent,
    handleRandomPrompt,
    handleEditorInput,
  };
}
