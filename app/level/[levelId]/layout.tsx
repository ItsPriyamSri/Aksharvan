// Server component — exports generateStaticParams for all [levelId] routes.
// This is the correct Next.js 14 App Router pattern:
// generateStaticParams lives in a server component (layout or page),
// while the actual UI is in "use client" page components.

import { getLevelStaticParams } from "@/lib/content/registry";

export function generateStaticParams() {
  return getLevelStaticParams();
}

export default function LevelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
