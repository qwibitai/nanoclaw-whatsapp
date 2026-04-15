---
name: add-media-attachments
description: Add GIF, video, and generic document attachment support for WhatsApp. Receives and sends GIFs inline, downloads videos and documents to workspace. Triggers on "add media", "gif support", "video attachments", "media attachments".
---

# Add Media Attachments

Adds support for receiving and sending GIFs, videos, and generic document attachments via WhatsApp. Without this skill, GIFs and videos are silently dropped (only captions pass through), and non-PDF/HTML documents are discarded.

## Prerequisites

- WhatsApp channel installed (`/add-whatsapp`)

## Phase 1: Pre-flight

1. Check if `videoMessage` handling exists in `src/channels/whatsapp.ts` (search for `normalized?.videoMessage` in the message processing block) — skip to Phase 3 if already applied

## Phase 2: Apply Code Changes

### Ensure WhatsApp fork remote

```bash
git remote -v
```

If `whatsapp` is missing, add it:

```bash
git remote add whatsapp https://github.com/qwibitai/nanoclaw-whatsapp.git
```

### Merge the skill branch

```bash
git fetch whatsapp skill/media-attachments
git merge whatsapp/skill/media-attachments || {
  git checkout --theirs package-lock.json
  git add package-lock.json
  git merge --continue
}
```

This merges in changes to `src/channels/whatsapp.ts`:

**Inbound:**
- GIF/video download: detects `videoMessage`, downloads media, saves as `.mp4`, labels as `[GIF]` or `[Video]` based on `gifPlayback` flag
- Generic document catch-all: downloads any document type (`.csv`, `.json`, `.docx`, etc.) and saves to workspace. Skips PDFs to avoid conflicts with `/add-pdf-reader`

**Outbound:**
- `sendFile()` method with mime type mapping for common file types
- GIF/video files sent as `video` with `gifPlayback: true` so they render inline instead of as document attachments

If the merge reports conflicts, resolve them by reading the conflicted files and understanding the intent of both sides.

### Validate

```bash
npm run build
npx vitest run src/channels/whatsapp.test.ts
```

### Restart service

```bash
launchctl kickstart -k gui/$(id -u)/com.nanoclaw  # macOS
# Linux: systemctl --user restart nanoclaw
```

## Phase 3: Verify

### Test GIF receive

Send a GIF in a registered WhatsApp chat. The agent should:
1. Download the GIF to `attachments/video-*.mp4`
2. See `[GIF: attachments/video-*.mp4 (size)]` in the message content
3. Respond acknowledging the GIF

### Test GIF send

Ask the agent to send back a GIF it received. It should render as an inline GIF in WhatsApp, not as a document or `.bin` file.

### Test document receive

Send a non-PDF, non-HTML document (e.g. `.csv`, `.json`). The agent should download it and show `[File: attachments/filename (size)]`.

### Check logs if needed

```bash
tail -f logs/nanoclaw.log | grep -iE "gif|video|document"
```

Look for:
- `Downloaded video/GIF attachment` — successful GIF/video download
- `Downloaded document attachment` — successful document download
- `GIF/video sent` — successful outbound GIF
- `Failed to download` — media download issue

## Troubleshooting

### GIF sent as .bin or .mp4 document

The `sendFile` method must send `.gif`/`.mp4` files as `video` with `gifPlayback: true`. Check that the `sendFile()` method exists and has the GIF/video early-return path.

### Agent doesn't see GIF content

GIFs are saved as files — the agent sees a text reference, not the visual content. For visual understanding of images, use the `/add-image-vision` skill. GIFs and videos are file references only.
