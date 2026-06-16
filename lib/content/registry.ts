// Aksharvan — Content Registry
// The ONLY place components import level data from.
// Add a new level: create lib/content/levelN.ts and register it here.
// No component should import from lib/content/level1.ts directly.

import type { Level } from "@/types/content";
import { level1 } from "./level1";

// ─── Level registry ───────────────────────────────────────────────────────────
// Key = levelId string (matches route param and progress doc id).

const LEVEL_REGISTRY: Record<string, Level> = {
  "level-1": level1,
  // "level-2": level2,  ← add here when content is ready
};

// ─── World config ─────────────────────────────────────────────────────────────
// Which levels exist, in order. Drives generateStaticParams, map regions, login init.

export const WORLD_LEVEL_IDS: string[] = Object.keys(LEVEL_REGISTRY);

/** The level the app initialises progress for on first login */
export const DEFAULT_LEVEL_ID = WORLD_LEVEL_IDS[0]; // "level-1"

// ─── Accessors ────────────────────────────────────────────────────────────────

/** Get a Level by id. Returns null for unknown ids (future-proof). */
export function getLevel(levelId: string): Level | null {
  return LEVEL_REGISTRY[levelId] ?? null;
}

/**
 * Get a Level by id. Throws if not found.
 * Use in contexts where absence is a programming error (e.g. exercise engine).
 */
export function requireLevel(levelId: string): Level {
  const level = LEVEL_REGISTRY[levelId];
  if (!level) {
    throw new Error(
      `[ContentRegistry] Unknown levelId: "${levelId}". ` +
        `Register it in lib/content/registry.ts.`
    );
  }
  return level;
}

/** All registered Level objects, in WORLD_LEVEL_IDS order */
export function getAllLevels(): Level[] {
  return WORLD_LEVEL_IDS.map((id) => LEVEL_REGISTRY[id]);
}

/** generateStaticParams array — used by all [levelId] routes */
export function getLevelStaticParams(): Array<{ levelId: string }> {
  return WORLD_LEVEL_IDS.map((id) => ({ levelId: id }));
}
