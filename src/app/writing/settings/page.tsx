'use client';

import React, { useState, useEffect } from 'react';
import { Save, FileText, BookOpen, Settings } from 'lucide-react';

export default function WritingSettingsPage() {
  const [activeTask, setActiveTask] = useState<'task1' | 'task2'>('task1');
  const [template1, setTemplate1] = useState('');
  const [template2, setTemplate2] = useState('');

  useEffect(() => {
    setTemplate1(localStorage.getItem('vstep_writing_t1_template') || '');
    setTemplate2(localStorage.getItem('vstep_writing_t2_template') || '');
  }, []);

  const handleSaveTemplate = () => {
    if (activeTask === 'task1') {
      localStorage.setItem('vstep_writing_t1_template', template1);
    } else {
      localStorage.setItem('vstep_writing_t2_template', template2);
    }
    alert('Đã lưu mẫu viết thành công!');
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
            onClick={() => setActiveTask('task1')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTask === 'task1' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Task 1 (Thư)</span>
          </button>
          <button
            onClick={() => setActiveTask('task2')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTask === 'task2' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Task 2 (Luận)</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
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

        <textarea
          value={activeTask === 'task1' ? template1 : template2}
          onChange={(e) => activeTask === 'task1' ? setTemplate1(e.target.value) : setTemplate2(e.target.value)}
          placeholder={activeTask === 'task1' 
            ? "Nhập bài mẫu thư trả lời thư điện tử tại đây (ví dụ: Dear Mr. Harrison, I am writing this letter to respond to your email...)"
            : "Nhập bài mẫu luận điểm viết luận tại đây..."}
          className="w-full min-h-[400px] p-4 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans resize-y"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
          <span>Số từ trong mẫu: <strong>{getWordCount(activeTask === 'task1' ? template1 : template2)} từ</strong></span>
          <span>Dữ liệu được lưu an toàn trong trình duyệt cục bộ</span>
        </div>
      </div>
    </div>
  );
}
