import dotEnv from 'dotenv';
import express from 'express';
import { toLocal, toS3 } from '../middlewares/multer.middleware.js';

dotEnv.config();

const router = express.Router();

//로컬에 1개 저장
router.post(
  '/uploadLocal/:group',
  toLocal.single('file'),
  function (req, res, next) {
    res.send(req.file);
  }
);

// 로컬에 여러개 저장
router.post(
  '/uploadsLocal/:group',
  toLocal.array('files', 5),
  function (req, res, next) {
    res.send(req.files);
  }
);

// S3에 1개 저장
router.post('/upload/:group', toS3.single('file'), function (req, res, next) {
  const loc = req.file.location;
  res.send({
    fileLocation: loc,
  });
});

// S3에 여러개 저장
router.post(
  '/uploads/:group',
  toS3.array('files', 5),
  function (req, res, next) {
    console.log(req.files);
    const loc = req.files.map((m) => {
      return { location: m.location };
    });
    res.send({
      fileLocation: loc,
    });
  }
);

export default router;
