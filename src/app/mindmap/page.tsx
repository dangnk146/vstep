import type { Metadata } from 'next';
import Mindmap from './Mindmap';

export const metadata: Metadata = {
  title: 'Mindmap 5 Topic Hubs VSTEP Speaking & Writing (317 Đề Thi Thật)',
  description: 'Sơ đồ tư duy mở rộng chiều ngang & Trang văn bản thụt lề tổng hợp 317 đề thi thật Speaking (Part 1, 2, 3) và Writing (Task 1, 2) cho 5 Topic Hubs VSTEP với từ vựng cốt lõi và khung Mini A-R-E.',
};

export default function MindmapPage() {
  return <Mindmap />;
}
