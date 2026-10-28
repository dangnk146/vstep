import type { Metadata } from 'next';
import SpeakingSimulation from '../SpeakingSimulation';
import { generateSpeakingMetadata } from '@/lib/serverExamMetadata';

type PageProps = {
  params: Promise<{ part?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  return generateSpeakingMetadata({ params, searchParams });
}

export default function SpeakingPartPage() {
  return <SpeakingSimulation />;
}

