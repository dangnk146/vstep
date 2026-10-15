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
    <div className="px-3 py-3">
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
        className="speaking-editor min-h-[230px] max-h-[48vh] overflow-y-auto bg-white p-3 text-[11px] leading-5 text-slate-800 outline-none dark:bg-card dark:text-foreground [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-extrabold [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
      />
    </div>
  );
}

