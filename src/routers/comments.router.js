import express from 'express';

const router = express.Router();

router.get('/me', async (req, res, next) => {
  try {
    return res.status(200).json('comments/me');
  } catch (err) {
    next(err);
  }
});

export default router;
