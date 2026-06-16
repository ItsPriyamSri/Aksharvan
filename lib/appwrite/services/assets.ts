import { ImageFormat } from 'appwrite';
import { storage } from '../client';
import { isAppwriteConfigured } from '../config';
import { BUCKET_IMAGES, BUCKET_ANIMATIONS } from '../constants';

const FOREST_STAGE_NAMES: Record<number, string> = {
  0: 'grey',
  1: 'color',
  2: 'grass',
  3: 'trees',
  4: 'rivers',
  5: 'animals',
  6: 'birds_sky',
};

export function getImageUrl(fileId: string, width?: number): string {
  if (fileId.startsWith('aw:')) {
    const strippedId = fileId.slice(3);
    if (isAppwriteConfigured()) {
      return String(
        storage.getFilePreview(
          BUCKET_IMAGES,
          strippedId,
          width,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          ImageFormat.Webp,
        ),
      );
    }
  }
  return `/assets/${fileId}`;
}

export function getAnimationUrl(fileId: string): string {
  if (fileId.startsWith('aw:')) {
    const strippedId = fileId.slice(3);
    if (isAppwriteConfigured()) {
      return String(storage.getFileView(BUCKET_ANIMATIONS, strippedId));
    }
  }
  return `/assets/${fileId}`;
}

export function getForestStageUrl(stage: number): string {
  const name = FOREST_STAGE_NAMES[stage] ?? 'grey';
  return `/assets/forest/forest_stage_${stage}_${name}.webp`;
}

export function getObjectImageUrl(objectId: string): string {
  return `/assets/objects/obj_${objectId}.webp`;
}

export function getCharacterUrl(character: 'tina' | 'toto'): string {
  return `/assets/characters/${character}_stick.webp`;
}
