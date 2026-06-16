import LevelPageClient from '@/components/LevelPageClient';

export function generateStaticParams() {
  return [{ levelId: 'level-1' }];
}

interface PageProps {
  params: { levelId: string };
}

export default function LevelPage({ params }: PageProps) {
  return <LevelPageClient levelId={params.levelId} />;
}
