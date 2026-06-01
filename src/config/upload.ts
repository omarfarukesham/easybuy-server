import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { Request } from 'express';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure the upload directory exists at startup.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Derive the extension from the (validated) MIME type, never the client name.
    const ext = MIME_EXT[file.mimetype] || '';
    const name = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, name);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (MIME_EXT[file.mimetype]) {
    cb(null, true);
  } else {
    const err: any = new Error('Unsupported file type');
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
