import type { Metadata } from 'next';
import Mindmap from './Mindmap';

export const metadata: Metadata = {
  title: 'Mindmap 5 Topic Hubs & Phân Tích Xu Hướng Đề VSTEP Speaking, Writing',
  description: 'Sơ đồ tư duy, trang văn bản từ vựng B2 và bảng phân tích xu hướng đề thi thực tế VSTEP Speaking (Part 1, 2, 3) và Writing (Task 1, 2) tính trực tiếp từ ngân hàng đề.',
};

export default function MindmapPage() {
  return <Mindmap />;
}
