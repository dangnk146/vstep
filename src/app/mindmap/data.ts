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
  id: 'letters' | 'work' | 'education' | 'health' | 'technology' | 'society' | string;
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
    id: 'work',
    title: 'Work, Career & Job Hugging',
    vietnameseTitle: 'Công việc, Sự nghiệp & Job Hugging',
    icon: 'Briefcase',
    topicCount: 8,
  },
  {
    id: 'education',
    title: 'Education, Campus & Learning',
    vietnameseTitle: 'Giáo dục, Campus & Học tập',
    icon: 'GraduationCap',
    topicCount: 8,
  },
  {
    id: 'health',
    title: 'Health, Habits & Lifestyle',
    vietnameseTitle: 'Sức khỏe, Thói quen & Lối sống',
    icon: 'HeartPulse',
    topicCount: 8,
  },
  {
    id: 'technology',
    title: 'Technology, Social Media & AI',
    vietnameseTitle: 'Công nghệ, Mạng xã hội & AI',
    icon: 'Laptop',
    topicCount: 8,
  },
  {
    id: 'society',
    title: 'Society, Charity & Environment',
    vietnameseTitle: 'Xã hội, Từ thiện & Môi trường',
    icon: 'Users',
    topicCount: 8,
  },
  {
    id: 'letters',
    title: 'Writing Task 1: 6 Letter Types',
    vietnameseTitle: 'Writing Task 1: 6 Dạng Thư Mẫu',
    icon: 'FileText',
    topicCount: 6,
  },
];
