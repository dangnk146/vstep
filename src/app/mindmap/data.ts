// Comprehensive Mindmap Data for 5 Topic Hubs covering 100% of 317 VSTEP Exam Questions
// Loaded from modular JSON files in src/data/mindmap/
import educationData from '@/data/mindmap/education.json';
import healthData from '@/data/mindmap/health.json';
import technologyData from '@/data/mindmap/technology.json';
import workData from '@/data/mindmap/work.json';
import societyData from '@/data/mindmap/society.json';

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

function normalizeTopic(raw: unknown): MindmapTopic {
  const topic = raw as MindmapTopic;
  return {
    ...topic,
    leftBranches: Array.isArray(topic.leftBranches) ? topic.leftBranches : [],
    rightBranches: Array.isArray(topic.rightBranches) ? topic.rightBranches : [],
  };
}

export const MINDMAP_TOPICS: MindmapTopic[] = [
  normalizeTopic(educationData),
  normalizeTopic(healthData),
  normalizeTopic(technologyData),
  normalizeTopic(workData),
  normalizeTopic(societyData),
];
