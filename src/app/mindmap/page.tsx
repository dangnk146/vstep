import type { Metadata } from 'next';
import Mindmap from './Mindmap';

export const metadata: Metadata = {
  title: 'Mindmap 5 Topic Hubs VSTEP Speaking & Writing',
  description: 'Sơ đồ tư duy mở rộng chiều ngang tổng hợp 153 đề thi thật và từ vựng cốt lõi cho 5 Topic Hubs VSTEP: Education & Skills, Health & Lifestyle, Technology & AI, Work & Career, Environment & Society.',
};

export default function MindmapPage() {
  return <Mindmap />;
}
