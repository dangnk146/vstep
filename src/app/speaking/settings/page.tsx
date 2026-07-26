'use client';

import React, { useState, useEffect } from 'react';
import { Save, Mic, Settings } from 'lucide-react';

type SpeakingPart = 'part1' | 'part2' | 'part3';

export default function SpeakingSettingsPage() {
  const [activePart, setActivePart] = useState<SpeakingPart>('part1');
  const [template1, setTemplate1] = useState('');
  const [template2, setTemplate2] = useState('');
  const [template3, setTemplate3] = useState('');

  useEffect(() => {
    setTemplate1(localStorage.getItem('vstep_speaking_part1_template') || '');
    setTemplate2(localStorage.getItem('vstep_speaking_part2_template') || '');
    setTemplate3(localStorage.getItem('vstep_speaking_part3_template') || '');
  }, []);

  const handleSaveTemplate = () => {
    if (activePart === 'part1') {
      localStorage.setItem('vstep_speaking_part1_template', template1);
    } else if (activePart === 'part2') {
      localStorage.setItem('vstep_speaking_part2_template', template2);
    } else {
      localStorage.setItem('vstep_speaking_part3_template', template3);
    }
    alert('Đã lưu mẫu nói thành công!');
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
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Cài Đặt Mẫu Nói</h1>
            <p className="text-muted-foreground text-sm font-medium">Cấu hình các mẫu cấu trúc nói VSTEP Part 1, 2, 3</p>
          </div>
        </div>

        {/* Part Selector */}
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          {(['part1', 'part2', 'part3'] as SpeakingPart[]).map((p) => (
            <button
              key={p}
              onClick={() => setActivePart(p)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                activePart === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Part {p === 'part1' ? '1' : p === 'part2' ? '2' : '3'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-muted-foreground">
            {activePart === 'part1' ? 'Mẫu câu trả lời Speaking Part 1' : activePart === 'part2' ? 'Mẫu cấu trúc Speaking Part 2' : 'Mẫu triển khai chủ đề Speaking Part 3'}
          </h2>
          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-primary/10"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Lưu mẫu</span>
          </button>
        </div>

        <textarea
          value={activePart === 'part1' ? template1 : activePart === 'part2' ? template2 : template3}
          onChange={(e) => {
            if (activePart === 'part1') setTemplate1(e.target.value);
            else if (activePart === 'part2') setTemplate2(e.target.value);
            else setTemplate3(e.target.value);
          }}
          placeholder={
            activePart === 'part1' 
              ? "Nhập các câu mở đầu hoặc mẫu câu giao tiếp tự giới thiệu..."
              : activePart === 'part2' 
                ? "Nhập cấu trúc thảo luận giải pháp (ví dụ: In my opinion, among the three choices, option A is the most suitable because...)"
                : "Nhập mẫu cấu trúc phát triển chủ đề..."
          }
          className="w-full min-h-[400px] p-4 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans resize-y"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
          <span>Số từ trong mẫu: <strong>{getWordCount(activePart === 'part1' ? template1 : activePart === 'part2' ? template2 : template3)} từ</strong></span>
          <span>Dữ liệu được lưu an toàn trong trình duyệt cục bộ</span>
        </div>
      </div>
    </div>
  );
}
