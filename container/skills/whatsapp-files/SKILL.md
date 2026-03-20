# WhatsApp File Attachments

When someone sends you a file, image, video, audio, or document via WhatsApp, it is automatically downloaded and saved to your group's `uploads/` folder before your turn starts.

## How attachments appear

The message content will include a reference like:

```
[attachment: /workspace/group/uploads/3EB0C123456789AB.jpg]
```

For documents with a filename:

```
[attachment: /workspace/group/uploads/3EB0C123456789AB_report.pdf]
```

## Reading attachments

The path is a real file on your filesystem. Use standard tools to read it:

- **Images/PDFs**: Use your browser tool or `cat` a converted form
- **Text files**: Read directly with `cat` or the Read tool
- **PDF**: Use `pdftotext` if the pdf-reader skill is installed, otherwise note it requires a reader
- **Audio/Video**: Note the file exists and describe it by type; you cannot play it but can describe metadata

## Supported types

Images (jpg, png, gif, webp, heic), Video (mp4, 3gp, mov), Audio (ogg, mp3, m4a, aac, wav), Documents (pdf, docx, xlsx, pptx, txt, zip), and others (saved as `.bin`).

## File naming

Files are named `{messageId}.{ext}` or `{messageId}_{originalFilename}` for documents. They persist across sessions in the group's uploads directory.
