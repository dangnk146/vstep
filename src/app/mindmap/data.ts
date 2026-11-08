// Mindmap Hubs metadata & type definitions
// Topic data is lazy-loaded on demand via /api/mindmap?hub=[id]

export interface MindmapItem {
  id: string;
  text: string;
  viText?: string;
  badge?: string;
}

export interface ARESkeleton {
  answer: string;
  answerVi: string;
  reason: string;
  reasonVi: string;
  example: string;
  exampleVi: string;
}

export interface MindmapKeyword {
  word: string;
  meaning: string;
}

export interface MindmapNode {
  id: string;
  title: string;
  viTitle?: string;
  badge?: string;
  tags?: string[];
  examTags?: string[];
  color?: string; // hex color code
  keywords?: MindmapKeyword[];
  areSkeleton?: ARESkeleton;
  items?: (string | MindmapItem)[];
  children?: MindmapNode[];
}

export interface MindmapTopic {
  id: 'education' | 'health' | 'technology' | 'work' | 'society' | string;
  title: string;
  vietnameseTitle: string;
  description: string;
  icon: string;
  centerNode: {
    title: string;
    subtitle: string;
    categoryBadge: string;
  };
  leftBranches: MindmapNode[];
  rightBranches: MindmapNode[];
}

export interface HubMetadata {
  id: string;
  title: string;
  vietnameseTitle: string;
  icon: string;
  topicCount: number;
}

export function normalizeTopic(raw: unknown): MindmapTopic {
  const topic = raw as MindmapTopic;
  return {
    ...topic,
    leftBranches: Array.isArray(topic.leftBranches) ? topic.leftBranches : [],
    rightBranches: Array.isArray(topic.rightBranches) ? topic.rightBranches : [],
  };
}

export const MINDMAP_HUBS: HubMetadata[] = [
  {
    id: 'education',
    title: 'Education & Skills',
    vietnameseTitle: 'Giáo dục, Học tập & Kỹ năng',
    icon: 'GraduationCap',
    topicCount: 15,
  },
  {
    id: 'health',
    title: 'Health & Lifestyle',
    vietnameseTitle: 'Sức khỏe & Lối sống',
    icon: 'HeartPulse',
    topicCount: 14,
  },
  {
    id: 'technology',
    title: 'Technology & Digital Life',
    vietnameseTitle: 'Công nghệ & Đời sống số',
    icon: 'Laptop',
    topicCount: 13,
  },
  {
    id: 'work',
    title: 'Work, Money & Career',
    vietnameseTitle: 'Công việc, Tiền bạc & Sự nghiệp',
    icon: 'Briefcase',
    topicCount: 15,
  },
  {
    id: 'society',
    title: 'Society & Community',
    vietnameseTitle: 'Xã hội, Gia đình & Môi trường',
    icon: 'Users',
    topicCount: 19,
  },
];
