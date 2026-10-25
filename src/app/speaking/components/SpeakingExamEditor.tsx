'use client';

import React, { useRef } from 'react';
import { sanitizeClipboardHtml } from '../utils/sanitize';

interface SpeakingExamEditorProps {
  examHtml: string;
  examKey: number;
  onInput: (html: string, text: string) => void;
}

export function SpeakingExamEditor({
  examHtml,
  examKey,
  onInput,
}: SpeakingExamEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    if (html) {
      document.execCommand('insertHTML', false, sanitizeClipboardHtml(html));
    } else {
      document.execCommand('insertText', false, text);
    }

    if (editorRef.current) {
      onInput(editorRef.current.innerHTML, editorRef.current.textContent || '');
    }
  };

  return (
    <div className="p-3 sm:p-4">
      <div
        key={examKey}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Nội dung đề Speaking"
        aria-multiline="true"
        dangerouslySetInnerHTML={{ __html: examHtml }}
        onInput={(event) => {
          const editor = event.currentTarget;
          onInput(editor.innerHTML, editor.textContent || '');
        }}
        onPaste={handlePaste}
        data-placeholder="Chọn đề trong Ngân hàng đề hoặc bấm xúc xắc để bắt đầu luyện nói…"
        className="speaking-editor min-h-[260px] max-h-[55vh] overflow-y-auto rounded-xs bg-card p-3.5 sm:p-5 text-sm sm:text-[15px] lg:text-base leading-relaxed text-foreground outline-none focus:outline-none [&_a]:text-primary [&_blockquote]:border-l-3 [&_blockquote]:border-primary/70 [&_blockquote]:bg-primary/5 [&_blockquote]:p-3 [&_blockquote]:rounded-r-xs [&_h1]:mb-3 [&_h1]:text-lg sm:[&_h1]:text-xl [&_h1]:font-black [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:text-base sm:[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_h3]:text-foreground [&_p]:mb-3 [&_p]:text-foreground/90 [&_li]:ml-5 [&_li]:mb-1.5 [&_ol]:list-decimal [&_ul]:list-disc"
      />
    </div>
  );
}

