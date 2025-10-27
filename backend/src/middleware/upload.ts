import multer from 'multer';
import path from 'path';

// Memory storage (dosyayı disk yerine RAM'de tut - daha hızlı)
const storage = multer.memoryStorage();

// Sadece Excel dosyalarına izin ver
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece Excel (.xlsx, .xls) ve CSV dosyaları yüklenebilir'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

