import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

router.post('/sign-up', async (req, res, next) => {
  try {
    return res.status(200).json('sign-up');
  } catch (err) {
    next(err);
  }
});

export default router;
