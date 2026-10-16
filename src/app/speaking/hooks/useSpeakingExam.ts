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
import { getExamApiSettings, requestExamApi, type RemoteExam } from '@/lib/examApi';

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

    const params = new URLSearchParams(window.location.search);
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1] as SpeakingPart | undefined;
    const queryPart = params.get('part') as SpeakingPart | null;
    const savedPart = localStorage.getItem(ACTIVE_PART_KEY) as SpeakingPart | null;
    const rawExam = params.get('exam')?.trim();

    const fallbackPart: SpeakingPart = pathPart
      || (queryPart === 'part1' || queryPart === 'part2' || queryPart === 'part3' ? queryPart : null)
      || (savedPart === 'part1' || savedPart === 'part2' || savedPart === 'part3' ? savedPart : null)
      || 'part1';

    const part = fallbackPart;
    let promptHtml: string | null = null;
    let selectedExamId: string | undefined;

    const savedExamId = localStorage.getItem(ACTIVE_EXAM_KEY);
    if (rawExam && savedExamId === rawExam) {
      promptHtml = localStorage.getItem(CUSTOM_EXAM_KEY) || '';
      selectedExamId = rawExam;
    } else if (consumeStoredPrompt) {
      promptHtml = localStorage.getItem(CUSTOM_EXAM_KEY) || '';
      if (savedExamId && promptHtml) selectedExamId = savedExamId;
    } else if (!rawExam) {
      promptHtml = '';
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
  const handleRandomPrompt = async () => {
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1] as SpeakingPart | undefined;
    const selectedPart: SpeakingPart = pathPart === 'part1' || pathPart === 'part2' || pathPart === 'part3'
      ? pathPart
      : activePart;

    const apiSettings = getExamApiSettings();
    if (apiSettings.endpoint) {
      setIsLoadingRandomPrompt(true);
      try {
        const result = await requestExamApi<RemoteExam>(apiSettings.endpoint, {
          action: 'random',
          skill: 'speaking',
          maTruong: apiSettings.school,
          dotThi: apiSettings.batch,
          part: selectedPart,
          count: selectedPart === 'part1' ? '2' : '1',
          limit: '1000',
        });
        const prompts = (result.items || []).map((item) => {
          const categoryPart = item.part === 'part1' || item.part === 'part2' || item.part === 'part3'
            ? item.part
            : selectedPart;
          return {
            id: item.id,
            category: `speaking-${categoryPart}` as ExamPrompt['category'],
            setId: '',
            title: item.title || item.id,
            content: item.content || item.title || item.id,
            group: item.group || [item.school, item.batch].filter(Boolean).join(' · '),
          };
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
        window.history.pushState(null, '', `/speaking/${part}?exam=${encodeURIComponent(examId)}`);
        return;
      } catch (error) {
        console.error('Could not load a random Speaking prompt from Apps Script.', error);
        window.alert(error instanceof Error ? error.message : 'Không thể tải đề Speaking.');
      } finally {
        setIsLoadingRandomPrompt(false);
      }
      return;
    }

    window.alert('Không tìm thấy cấu hình nguồn đề. Hãy mở mục Đề thi để kiểm tra kết nối.');
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
