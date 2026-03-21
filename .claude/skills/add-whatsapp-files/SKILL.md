---
name: add-whatsapp-files
description: Add WhatsApp file attachment support — automatically download and save incoming media, images, documents, audio, and video so agents can read them.
---

# Add WhatsApp Files

This skill adds media attachment handling to NanoClaw's WhatsApp channel. When a user sends a file, image, video, audio, or document, it is automatically downloaded and saved to the group's `uploads/` directory before the agent runs. The agent receives the file path as part of the message content.

## Phase 1: Pre-flight

### Check if already applied

```bash
grep -q 'MIME_TO_EXT' src/channels/whatsapp.ts && echo "Already applied" || echo "Not applied"
```

If already applied, skip to Phase 3 (Verify).

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
git fetch whatsapp skill/whats-app-files
git merge whatsapp/skill/whats-app-files || {
  git checkout --theirs package-lock.json
  git add package-lock.json
  git merge --continue
}
```

This adds:
- `container/skills/whatsapp-files/SKILL.md` (agent-facing documentation explaining how attachments appear in messages)
- Media download logic in `src/channels/whatsapp.ts`: detects images, video, audio, documents, and stickers; downloads them to `groups/{folder}/uploads/`; appends `[attachment: /workspace/group/uploads/{filename}]` to the message content

### Validate code changes

```bash
npm test
npm run build
```

All tests must pass and build must be clean before proceeding.

## Phase 3: Verify

### Build and restart

```bash
npm run build
```

Linux:
```bash
systemctl --user restart nanoclaw
```

macOS:
```bash
launchctl kickstart -k gui/$(id -u)/com.nanoclaw
```

### Test file attachments

1. Send an image or document to your registered WhatsApp group
2. Check the uploads directory for the downloaded file:

```bash
ls groups/*/uploads/
```

3. Ask the agent to describe the file — it should reference the path and be able to read it

### Verify agent sees attachment

The agent's message content should include something like:

```
[attachment: /workspace/group/uploads/3EB0C123456789AB.jpg]
```

## Troubleshooting

### File not appearing in uploads/

- Check NanoClaw logs for `Failed to download media` errors
- Verify the WhatsApp channel is connected
- Ensure the group is registered — attachments are only downloaded for registered groups

### Agent receives path but file is empty or missing

- The download may have failed silently; check logs for `Failed to download media` with the error detail
- WhatsApp media links expire — if the message is old, re-send the file

### Conflicts when merging with skill/reactions

If both `skill/whats-app-files` and `skill/reactions` are being merged, conflicts will appear in `src/channels/whatsapp.ts`. Resolve by keeping both the media download block and the reaction event handler — they operate in different event listeners.
