'use client';

import React, { useState, useEffect } from 'react';
import { Save, FileText, BookOpen, Settings } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';

const EDITOR_BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
};

const EDITOR_EXTENSIONS = [
  EditorView.lineWrapping,
  EditorView.theme({
    "&": {
      height: "100%",
      backgroundColor: "transparent",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono), monospace",
      overflow: "auto",
    },
    ".cm-gutters": {
      backgroundColor: "var(--muted)",
      color: "var(--muted-foreground)",
      borderRight: "1px solid var(--border)",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-content": {
      padding: "16px",
      caretColor: "var(--foreground)",
    },
    ".cm-gutterElement": {
      paddingRight: "8px",
    }
  })
];

export interface FreeTemplate {
  id: string;
  title: string;
  type: 'writing' | 'speaking';
  content: string;
}

export default function WritingSettingsPage() {
  const [activeTask, setActiveTask] = useState<'task1' | 'task2' | 'free'>('task1');
  const [template1, setTemplate1] = useState('');
  const [template2, setTemplate2] = useState('');

  // Free templates
  const [freeTemplates, setFreeTemplates] = useState<FreeTemplate[]>([]);
  const [freeTitle, setFreeTitle] = useState('');
  const [freeContent, setFreeContent] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Synchronize active task with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskParam = params.get('task');
    if (taskParam === 'task1' || taskParam === 'task2' || taskParam === 'free') {
      setActiveTask(taskParam);
    }
  }, []);

  const handleTabChange = (task: 'task1' | 'task2' | 'free') => {
    setActiveTask(task);
    const params = new URLSearchParams(window.location.search);
    params.set('task', task);
    window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setTemplate1(localStorage.getItem('vstep_writing_t1_template') || '');
    setTemplate2(localStorage.getItem('vstep_writing_t2_template') || '');

    // Load free templates
    const saved = localStorage.getItem('vstep_free_templates');
    if (saved) {
      try {
        setFreeTemplates(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveTemplate = () => {
    if (activeTask === 'task1') {
      localStorage.setItem('vstep_writing_t1_template', template1);
    } else {
      localStorage.setItem('vstep_writing_t2_template', template2);
    }
    alert('Đã lưu mẫu viết thành công!');
  };

  const handleSaveFreeTemplate = () => {
    if (!freeTitle.trim() || !freeContent.trim()) {
      alert('Vui lòng nhập Tên/Năm đề thi và Nội dung bài mẫu!');
      return;
    }

    let updated: FreeTemplate[] = [];
    if (editId) {
      updated = freeTemplates.map(t => t.id === editId ? { ...t, title: freeTitle, content: freeContent } : t);
      alert('Đã cập nhật đề tự do thành công!');
    } else {
      const newTemp: FreeTemplate = {
        id: Date.now().toString(),
        title: freeTitle,
        type: 'writing',
        content: freeContent
      };
      updated = [...freeTemplates, newTemp];
      alert('Đã thêm đề tự do mới thành công!');
    }

    setFreeTemplates(updated);
    localStorage.setItem('vstep_free_templates', JSON.stringify(updated));
    setFreeTitle('');
    setFreeContent('');
    setEditId(null);
  };

  const handleDeleteFreeTemplate = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đề tự do này không?')) {
      const updated = freeTemplates.filter(t => t.id !== id);
      setFreeTemplates(updated);
      localStorage.setItem('vstep_free_templates', JSON.stringify(updated));
      if (editId === id) {
        setFreeTitle('');
        setFreeContent('');
        setEditId(null);
      }
    }
  };

  const handleStartEditFree = (template: FreeTemplate) => {
    setEditId(template.id);
    setFreeTitle(template.title);
    setFreeContent(template.content);
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  return (
    <div className="flex flex-col space-y-6 h-full w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Cài Đặt Mẫu Viết</h1>
            <p className="text-muted-foreground text-sm font-medium">Cấu hình thư mẫu và bài luận mẫu VSTEP</p>
          </div>
        </div>

        {/* Task Selector */}
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => handleTabChange('task1')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTask === 'task1' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Task 1 (Thư)</span>
          </button>
          <button
            onClick={() => handleTabChange('task2')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTask === 'task2' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Task 2 (Luận)</span>
          </button>
          <button
            onClick={() => handleTabChange('free')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTask === 'free' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-4 w-4 text-primary" />
            <span>Đề Tự Do (Năm/Tên)</span>
          </button>
        </div>
      </div>

      {activeTask === 'free' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form to Add/Edit */}
          <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h2 className="font-bold text-sm text-foreground">
                {editId ? 'Hiệu chỉnh đề tự do' : 'Thêm đề tự do mới (Nhập bài mẫu theo Tên/Năm)'}
              </h2>
              <button
                onClick={handleSaveFreeTemplate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-primary/10"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{editId ? 'Cập nhật' : 'Lưu đề mới'}</span>
              </button>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Tên / Năm Đề Thi (Ví dụ: Đề thư năm 2025 - Hobbies)</label>
              <input
                type="text"
                value={freeTitle}
                onChange={(e) => setFreeTitle(e.target.value)}
                placeholder="Nhập tên đề hoặc năm thi để dễ lựa chọn khi luyện tập..."
                className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Nội dung bài viết mẫu</label>
              <div className="flex bg-muted/20 border border-border rounded-xl overflow-hidden text-sm h-[320px] focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
                <CodeMirror
                  value={freeContent}
                  onChange={(value) => setFreeContent(value)}
                  placeholder="Nhập nội dung bài viết mẫu để đối chiếu so sánh khi luyện gõ..."
                  height="316px"
                  theme="none"
                  className="flex-1 text-sm font-mono focus:outline-none"
                  basicSetup={EDITOR_BASIC_SETUP}
                  extensions={EDITOR_EXTENSIONS}
                />
              </div>
            </div>
            
            {editId && (
              <button
                onClick={() => {
                  setEditId(null);
                  setFreeTitle('');
                  setFreeContent('');
                }}
                className="text-center text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer underline"
              >
                Hủy hiệu chỉnh (Tạo đề mới)
              </button>
            )}
          </div>

          {/* List of Existing */}
          <div className="bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4 shadow-sm h-max">
            <h2 className="font-bold text-sm border-b border-border pb-2.5 text-muted-foreground">
              Danh sách đề tự do ({freeTemplates.filter(t => t.type === 'writing').length})
            </h2>
            
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {freeTemplates.filter(t => t.type === 'writing').length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                  Chưa có đề tự do nào được thêm. Hãy nhập đề bên cạnh!
                </div>
              ) : (
                freeTemplates.filter(t => t.type === 'writing').map((t) => (
                  <div key={t.id} className="p-3.5 bg-muted/40 border border-border rounded-xl flex flex-col space-y-2.5">
                    <div className="font-bold text-xs text-foreground truncate" title={t.title}>
                      🎯 {t.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium line-clamp-2">
                      {t.content}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleStartEditFree(t)}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteFreeTemplate(t.id)}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Main Form */
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-muted-foreground">
              {activeTask === 'task1' ? 'Mẫu thư trả lời VSTEP Task 1' : 'Mẫu bài viết luận VSTEP Task 2'}
            </h2>
            <button
              onClick={handleSaveTemplate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-primary/10"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Lưu cấu hình</span>
            </button>
          </div>

          <div className="flex bg-muted/20 border border-border rounded-xl overflow-hidden text-sm h-[400px] focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
            <CodeMirror
              value={activeTask === 'task1' ? template1 : template2}
              onChange={(value) => activeTask === 'task1' ? setTemplate1(value) : setTemplate2(value)}
              placeholder={activeTask === 'task1' 
                ? "Nhập bài mẫu thư trả lời thư điện tử tại đây (ví dụ: Dear Mr. Harrison, I am writing this letter to respond to your email...)"
                : "Nhập bài mẫu luận điểm viết luận tại đây..."}
              height="396px"
              theme="none"
              className="flex-1 text-sm font-mono focus:outline-none"
              basicSetup={EDITOR_BASIC_SETUP}
              extensions={EDITOR_EXTENSIONS}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
            <span>Số từ trong mẫu: <strong>{getWordCount(activeTask === 'task1' ? template1 : template2)} từ</strong></span>
            <span>Dữ liệu được lưu an toàn trong trình duyệt cục bộ</span>
          </div>
        </div>
      )}
    </div>
  );
}
