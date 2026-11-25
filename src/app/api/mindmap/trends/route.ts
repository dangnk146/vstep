import { NextResponse } from 'next/server';
import { getExamTrendsDataset } from '@/lib/examTrends';

export async function GET() {
  try {
    const dataset = await getExamTrendsDataset();
    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Error in /api/mindmap/trends:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Không thể tải dữ liệu phân tích xu hướng đề thi.',
      },
      { status: 500 }
    );
  }
}

