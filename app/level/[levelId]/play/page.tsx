import PlayPageClient from '@/components/PlayPageClient';

export function generateStaticParams() {
  return [{ levelId: 'level-1' }];
}

interface PageProps {
  params: { levelId: string };
}

export default function PlayPage({ params }: PageProps) {
  return <PlayPageClient levelId={params.levelId} />;
}
