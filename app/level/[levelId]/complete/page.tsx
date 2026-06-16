import CompletePageClient from '@/components/CompletePageClient';

export function generateStaticParams() {
  return [{ levelId: 'level-1' }];
}

interface PageProps {
  params: { levelId: string };
}

export default function CompletePage({ params }: PageProps) {
  return <CompletePageClient levelId={params.levelId} />;
}
