import type { Metadata } from 'next';
import Mindmap from './Mindmap';

export const metadata: Metadata = {
  title: 'Mindmap Ý tưởng & Từ vựng VSTEP',
  description: 'Sơ đồ tư duy mở rộng chiều ngang tổng hợp từ vựng và ý tưởng cho VSTEP Writing & Speaking: Education, Environment, Lifestyles, Technology, Transport.',
};

export default function MindmapPage() {
  return <Mindmap />;
}
