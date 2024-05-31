import express from 'express';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    return res.status(200).json('users');
  } catch (err) {
    next(err);
  }
});

export default router;
