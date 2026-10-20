'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import { toPromptEditorHtml, type ExamPrompt } from '@/utils/examPrompts';
import {
  ACTIVE_EXAM_KEY,
  ACTIVE_PART_KEY,
  CUSTOM_EXAM_KEY,
  type SpeakingPart,
} from '../types';
import { sanitizeClipboardHtml } from '../utils/sanitize';
import {
  buildExamQueryString,
  fetchExamPromptsByIds,
  getExamApiSettings,
  getRandomExamPrompts,
  parseExamQueryString,
  saveExamApiSettings,
} from '@/lib/examApi';

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

  const syncFromLocation = useCallback((consumeStoredPrompt: boolean) => {
    if (typeof window === 'undefined') return;

    const parsedQuery = parseExamQueryString(window.location.search);
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1] as SpeakingPart | undefined;
    const queryPart = parsedQuery.part as SpeakingPart | null;
    const savedPart = localStorage.getItem(ACTIVE_PART_KEY) as SpeakingPart | null;
    const rawExam = parsedQuery.exam;
    const urlSchool = parsedQuery.matruong;
    const urlBatch = parsedQuery.batch;

    const hasFilterInUrl = urlSchool !== undefined || urlBatch !== undefined;
    const currentSettings = getExamApiSettings();
    let nextSchool = currentSettings.school;
    let nextBatch = currentSettings.batch;

    // Sync filter from URL to localStorage if provided
    if (hasFilterInUrl) {
      nextSchool = urlSchool && urlSchool.toLowerCase() !== 'all' ? urlSchool : '';
      nextBatch = urlBatch && urlBatch.toLowerCase() !== 'all' ? urlBatch : '';
      if (nextSchool !== currentSettings.school || nextBatch !== currentSettings.batch) {
        saveExamApiSettings({ school: nextSchool, batch: nextBatch });
      }
    }

    const fallbackPart: SpeakingPart = pathPart
      || (queryPart === 'part1' || queryPart === 'part2' || queryPart === 'part3' ? queryPart : null)
      || (savedPart === 'part1' || savedPart === 'part2' || savedPart === 'part3' ? savedPart : null)
      || 'part1';

    const part = fallbackPart;
    let promptHtml: string | null = null;
    let selectedExamId: string | undefined = rawExam || undefined;

    const savedExamId = localStorage.getItem(ACTIVE_EXAM_KEY);
    const savedExamHtml = localStorage.getItem(CUSTOM_EXAM_KEY);

    if (rawExam) {
      selectedExamId = rawExam;
      if (savedExamId === rawExam && savedExamHtml) {
        promptHtml = savedExamHtml;
      } else {
        promptHtml = null;
      }
    } else if (consumeStoredPrompt && savedExamHtml) {
      promptHtml = savedExamHtml;
      if (savedExamId) selectedExamId = savedExamId;
    } else {
      promptHtml = '';
      selectedExamId = undefined;
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
              localStorage.setItem(CUSTOM_EXAM_KEY, html);
              localStorage.setItem(ACTIVE_EXAM_KEY, selectedExamId!);
            });

            if (!hasFilterInUrl) {
              const promptSchool = found[0].school || '';
              const promptBatch = found[0].batch || '';
              if (promptSchool || promptBatch) {
                saveExamApiSettings({ school: promptSchool, batch: promptBatch });
              }
            }
          }
        })
        .catch(console.error);
    }

    const queryStr = buildExamQueryString({
      matruong: nextSchool,
      batch: nextBatch,
      exam: selectedExamId,
    });
    const canonicalUrl = `/speaking/${part}${queryStr ? `?${queryStr}` : ''}`;
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

      const parsed = parseExamQueryString(window.location.search);
      delete parsed.exam;
      const queryStr = buildExamQueryString(parsed);
      window.history.replaceState(
        null,
        '',
        `/speaking/${section}${queryStr ? `?${queryStr}` : ''}`,
      );
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
      localStorage.setItem(CUSTOM_EXAM_KEY, content);
      localStorage.setItem(ACTIVE_EXAM_KEY, examId);
      localStorage.setItem(ACTIVE_PART_KEY, part);

      const queryStr = buildExamQueryString({
        matruong: apiSettings.school,
        batch: apiSettings.batch,
        exam: examId,
      });
      window.history.pushState(null, '', `/speaking/${part}${queryStr ? `?${queryStr}` : ''}`);
    } catch (error) {
      console.error('Could not load a random Speaking prompt.', error);
      window.alert(error instanceof Error ? error.message : 'Không thể tải đề Speaking.');
    } finally {
      setIsLoadingRandomPrompt(false);
    }
  };

  const handleEditorInput = (html: string, text: string) => {
    localStorage.setItem(CUSTOM_EXAM_KEY, html);
    localStorage.removeItem(ACTIVE_EXAM_KEY);

    const parsed = parseExamQueryString(window.location.search);
    if (parsed.exam) {
      delete parsed.exam;
      const queryStr = buildExamQueryString(parsed);
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${queryStr ? `?${queryStr}` : ''}`,
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
