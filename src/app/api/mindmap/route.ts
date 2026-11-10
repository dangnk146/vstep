import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type HubMetadata = {
  id: string;
  title: string;
  vietnameseTitle: string;
  icon: string;
  topicCount: number;
};

const MINDMAP_DIR = path.join(process.cwd(), 'src', 'data', 'mindmap');
const fileCache = new Map<string, unknown>();

const VALID_HUBS = ['work', 'education', 'health', 'technology', 'society', 'letters'] as const;
type ValidHub = (typeof VALID_HUBS)[number];

const HUBS_METADATA: Record<ValidHub, Omit<HubMetadata, 'topicCount'>> = {
  work: {
    id: 'work',
    title: 'Work, Career & Job Hugging',
    vietnameseTitle: 'Công việc, Sự nghiệp & Job Hugging',
    icon: 'Briefcase',
  },
  education: {
    id: 'education',
    title: 'Education, Campus & Learning',
    vietnameseTitle: 'Giáo dục, Campus & Học tập',
    icon: 'GraduationCap',
  },
  health: {
    id: 'health',
    title: 'Health, Habits & Lifestyle',
    vietnameseTitle: 'Sức khỏe, Thói quen & Lối sống',
    icon: 'HeartPulse',
  },
  technology: {
    id: 'technology',
    title: 'Technology, Social Media & AI',
    vietnameseTitle: 'Công nghệ, Mạng xã hội & AI',
    icon: 'Laptop',
  },
  society: {
    id: 'society',
    title: 'Society, Charity & Environment',
    vietnameseTitle: 'Xã hội, Từ thiện & Môi trường',
    icon: 'Users',
  },
  letters: {
    id: 'letters',
    title: 'Writing Task 1: 6 Letter Types',
    vietnameseTitle: 'Writing Task 1: 6 Dạng Thư Mẫu',
    icon: 'FileText',
  },
};

// Count topics in a hub data object
function countHubTopics(data: any): number {
  if (!data) return 0;
  const left = Array.isArray(data.leftBranches) ? data.leftBranches : [];
  const right = Array.isArray(data.rightBranches) ? data.rightBranches : [];
  const allBranches = [...left, ...right];
  return allBranches.reduce((acc, b) => acc + (Array.isArray(b.children) ? b.children.length : 0), 0);
}

// Read and cache hub json file
async function getHubData(hubId: ValidHub) {
  if (fileCache.has(hubId)) {
    return fileCache.get(hubId);
  }

  const filePath = path.join(MINDMAP_DIR, `${hubId}.json`);
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  fileCache.set(hubId, parsed);
  return parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hubParam = searchParams.get('hub')?.toLowerCase().trim() as ValidHub;

    // 1. Action: hubs -> Return list of all 5 Hubs with metadata and topic counts
    if (action === 'hubs') {
      const hubsList: HubMetadata[] = [];
      let totalTopics = 0;

      for (const id of VALID_HUBS) {
        try {
          const data = await getHubData(id);
          const count = countHubTopics(data);
          totalTopics += count;
          hubsList.push({
            ...HUBS_METADATA[id],
            topicCount: count,
          });
        } catch {
          hubsList.push({
            ...HUBS_METADATA[id],
            topicCount: 0,
          });
        }
      }

      return NextResponse.json({
        ok: true,
        hubs: hubsList,
        totalTopics,
      });
    }

    // 2. Action: Return specific hub data (default: education)
    const targetHub: ValidHub = VALID_HUBS.includes(hubParam) ? hubParam : 'education';
    const hubData = await getHubData(targetHub);

    return NextResponse.json({
      ok: true,
      hub: targetHub,
      data: hubData,
    });
  } catch (error) {
    console.error('Error in /api/mindmap:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to load mindmap hub data',
      },
      { status: 500 }
    );
  }
}

