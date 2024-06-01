import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

router.get('/me', async (req, res, next) => {
  try {
    return res.status(200).json('posts/me');
  } catch (err) {
    next(err);
  }
});

export default router;
