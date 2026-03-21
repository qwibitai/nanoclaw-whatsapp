import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import type { WAMessage } from '@whiskeysockets/baileys';

const MAX_DIMENSION = 1024;
const IMAGE_REF_PATTERN =
  /\[Image: (attachments\/[^\]\s]+)(?:\s+original:(attachments\/[^\]]+))?\]/g;

const FORMAT_TO_EXT: Record<string, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
  tiff: 'tiff',
  avif: 'avif',
};

export interface ProcessedImage {
  content: string;
  relativePath: string;
  originalRelativePath: string;
}

export interface ImageAttachment {
  relativePath: string;
  mediaType: string;
  originalRelativePath: string;
}

export function isImageMessage(msg: WAMessage): boolean {
  return !!msg.message?.imageMessage;
}

export async function processImage(
  buffer: Buffer,
  groupDir: string,
  caption: string,
): Promise<ProcessedImage | null> {
  if (!buffer || buffer.length === 0) return null;

  const attachDir = path.join(groupDir, 'attachments');
  fs.mkdirSync(attachDir, { recursive: true });

  const stem = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Detect original format and save at full resolution
  const metadata = await sharp(buffer).metadata();
  const origExt = FORMAT_TO_EXT[metadata.format ?? ''] ?? 'jpg';
  const originalFilename = `${stem}-original.${origExt}`;
  fs.writeFileSync(path.join(attachDir, originalFilename), buffer);

  // Save resized version for Claude prompt
  const resized = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const resizedFilename = `${stem}.jpg`;
  fs.writeFileSync(path.join(attachDir, resizedFilename), resized);

  const relativePath = `attachments/${resizedFilename}`;
  const originalRelativePath = `attachments/${originalFilename}`;
  const content = caption
    ? `[Image: ${relativePath} original:${originalRelativePath}] ${caption}`
    : `[Image: ${relativePath} original:${originalRelativePath}]`;

  return { content, relativePath, originalRelativePath };
}

export function parseImageReferences(
  messages: Array<{ content: string }>,
): ImageAttachment[] {
  const refs: ImageAttachment[] = [];
  for (const msg of messages) {
    let match: RegExpExecArray | null;
    IMAGE_REF_PATTERN.lastIndex = 0;
    while ((match = IMAGE_REF_PATTERN.exec(msg.content)) !== null) {
      refs.push({
        relativePath: match[1],
        mediaType: 'image/jpeg',
        originalRelativePath: match[2] || match[1],
      });
    }
  }
  return refs;
}
