'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  Mic, 
  ArrowRight,
  TrendingUp,
  Settings,
  FileCheck,
  FileText
} from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    writingTemplates: 0,
    speakingTemplates: 0
  });

  useEffect(() => {
    const hasT1 = localStorage.getItem('vstep_writing_t1_template') ? 1 : 0;
    const hasT2 = localStorage.getItem('vstep_writing_t2_template') ? 1 : 0;
    const hasS1 = localStorage.getItem('vstep_speaking_part1_template') ? 1 : 0;
    const hasS2 = localStorage.getItem('vstep_speaking_part2_template') ? 1 : 0;
    const hasS3 = localStorage.getItem('vstep_speaking_part3_template') ? 1 : 0;

    setStats({
      writingTemplates: hasT1 + hasT2,
      speakingTemplates: hasS1 + hasS2 + hasS3
    });
  }, []);

  const cards = [
    {
      name: '📖 Reading (Đọc)',
      description: 'Mô phỏng đếm giờ thi đọc VSTEP (40 câu hỏi) trong 60 phút. Hỗ trợ bộ phím tắt thông minh điều khiển thời gian dễ dàng.',
      href: '/reading',
      icon: BookOpen,
      color: 'from-blue-700 to-indigo-600',
      badge: '60 phút ⏱️',
      stats: '🎯 40 câu hỏi'
    },
    {
      name: '🎧 Listening (Nghe)',
      description: 'Đếm ngược 40 phút thi nghe 3 phần (35 câu hỏi). Hỗ trợ tải lên file âm thanh ôn luyện riêng của bạn để làm bài.',
      href: '/listening',
      icon: Headphones,
      color: 'from-indigo-600 to-purple-600',
      badge: '40 phút ⏱️',
      stats: '🎯 35 câu hỏi'
    },
    {
      name: '✍️ Writing (Viết)',
      description: 'Luyện gõ thư điện tử (Task 1) và viết luận (Task 2). Tự động so khớp từng chữ cái với bài mẫu để ghi nhớ cấu trúc.',
      href: '/writing',
      icon: PenTool,
      color: 'from-purple-600 to-violet-600',
      badge: '2 bài viết 📝',
      stats: `💾 ${stats.writingTemplates}/2 mẫu đã lưu`
    },
    {
      name: '🗣️ Speaking (Nói)',
      description: 'Luyện nói phản xạ 3 phần (đếm ngược chuẩn bị và tự động ghi âm giới hạn giờ). Ghi âm nói và so sánh dàn ý với mẫu.',
      href: '/speaking',
      icon: Mic,
      color: 'from-violet-600 to-fuchsia-600',
      badge: '3 phần nói 🎙️',
      stats: `💾 ${stats.speakingTemplates}/3 mẫu đã lưu`
    }
  ];

  return (
    <div className="flex flex-col space-y-8 w-full animate-fade-in pb-10">
      {/* Intro Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/30 to-transparent border border-border p-8 md:p-12 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1.5 rounded-full inline-block animate-bounce">
            🚀 VSTEP Study Hub
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight animate-fade-in">
            Chinh phục chứng chỉ <br />
            <span className="bg-vstep-gradient bg-clip-text text-transparent">
              VSTEP Tiếng Anh 🎯
            </span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-lg leading-relaxed">
            Ứng dụng hỗ trợ tự ôn luyện thi VSTEP toàn diện. Thiết lập bài mẫu của riêng bạn, luyện tập phản xạ gõ khớp từ ký tự và ghi âm trả lời trực tiếp dưới áp lực thời gian.
          </p>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
      </div>

      {/* Grid of Skill Sections */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span>📚</span>
          <span>Các Kỹ Năng Luyện Tập</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link 
                key={card.href} 
                href={card.href}
                className="group relative flex flex-col bg-card border border-border hover:border-primary/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1.5 overflow-hidden cursor-pointer"
              >
                {/* Background Accent Gradient on Hover */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 rounded-bl-[80px] transition-opacity duration-300 pointer-events-none`} />

                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${card.color} text-white rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5 w-5 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-muted rounded-full text-muted-foreground border border-border">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{card.name}</span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-primary" />
                </h3>

                <p className="text-muted-foreground text-xs leading-relaxed mt-2 mb-4 flex-1">
                  {card.description}
                </p>

                <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-muted-foreground mt-auto">
                  <span>{card.stats}</span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-bold">
                    <span>Vào luyện ngay</span>
                    <span>👉</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Local Practice Guide Box */}
      <div className="bg-card border border-border p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-2">
          <h3 className="font-extrabold text-base flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>🔥 Phương pháp luyện Template (Mẫu Viết/Nói)</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Học thuộc bài mẫu bằng phương pháp phản xạ: Lưu cấu hình bài viết hoặc bài nói mẫu ở bảng cài đặt. Chuyển sang khung luyện tập để gõ lại. Hệ thống sẽ so khớp từng chữ cái một, phát hiện lỗi sai, dư thừa hoặc thiếu sót tức thì để bạn ghi nhớ từ vựng sâu sắc.
          </p>
        </div>
        <div className="flex justify-end">
          <div className="p-4 bg-muted rounded-2xl border border-border text-xs text-muted-foreground space-y-1.5 w-full md:w-auto font-semibold">
            <div className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-emerald-500" /> <span>✅ Học từ lỗi sai tức thì</span></div>
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> <span>✍️ Phân loại Task cụ thể</span></div>
            <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-accent-foreground" /> <span>💾 Lưu trữ cục bộ an toàn</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
