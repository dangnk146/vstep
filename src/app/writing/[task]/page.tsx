import type { Metadata } from 'next';
import WritingSimulation from '../WritingSimulation';
import { generateWritingMetadata } from '@/lib/serverExamMetadata';

type PageProps = {
  params: Promise<{ task?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  return generateWritingMetadata({ params, searchParams });
}

export default function WritingTaskPage() {
  return <WritingSimulation />;
}
