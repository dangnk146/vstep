import { notFound } from 'next/navigation';
import ListeningPage from '../../page';
import rawVideoData from '../../listvideo.json';

type VideoMap = {
  part1: string[];
  part2: string[];
  part3: string[];
};

const videoData: VideoMap =
  (rawVideoData as VideoMap & { default?: VideoMap }).default ?? (rawVideoData as VideoMap);

export default async function PartVideoPage({
  params,
}: {
  params: Promise<{ part: string; video: string }>;
}) {
  const { part, video } = await params;
  if (part !== 'part1' && part !== 'part2' && part !== 'part3') {
    notFound();
  }

  const partVideos = videoData[part];
  const match = /^video(\d+)$/.exec(video);
  const videoNumber = match ? Number(match[1]) : NaN;
  if (!match || !Array.isArray(partVideos) || videoNumber < 1 || videoNumber > partVideos.length) {
    notFound();
  }

  return <ListeningPage />;
}