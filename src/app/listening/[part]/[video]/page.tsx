import { notFound } from 'next/navigation';
import ListeningPage from '../../page';
import videoData from '../../listvideo.json';

type PartId = keyof typeof videoData;

export default async function PartVideoPage({
  params,
}: {
  params: Promise<{ part: string; video: string }>;
}) {
  const { part, video } = await params;
  if (!Object.prototype.hasOwnProperty.call(videoData, part)) notFound();

  const videoNumber = Number(video.replace('video', ''));
  const partVideos = videoData[part as PartId];
  if (!/^video\d+$/.test(video) || videoNumber < 1 || videoNumber > partVideos.length) {
    notFound();
  }

  return <ListeningPage />;
}