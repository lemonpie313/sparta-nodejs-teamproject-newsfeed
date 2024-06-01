import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { MESSAGES } from '../const/messages.const.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await prisma.Users.findFirst({
      where: {
        userId,
      },
      select: {
        userId: true,
        email: true,
        UserInfos: {
          select: {
            name: true,
            nickname: true,
            selfIntroduction: true,
            profilePicture: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.READ.SUCCEED,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
