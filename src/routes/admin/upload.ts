import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../../config/upload';

const router = Router();

const single = upload.single('image');

// POST /api/admin/upload — multipart/form-data, field "image"
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  single(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: { code: 'file_too_large', message: 'File exceeds 2MB limit' } });
        }
        return res.status(400).json({ error: { code: 'upload_error', message: err.message } });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: { code: 'invalid_file_type', message: 'Only jpeg, png and webp images are allowed' } });
      }
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({ error: { code: 'no_file', message: 'No file uploaded (field "image")' } });
    }

    const base = (process.env.PUBLIC_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
    const url = `${base}/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename, size: req.file.size });
  });
});

export default router;
