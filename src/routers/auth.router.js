import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { signUpValidator } from '../middlewares/joi/auth.joi.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import bycrpt from 'bcrypt';
import { Prisma } from '@prisma/client';

const router = express.Router();

//회원가입
router.post('/sign-up', signUpValidator, async (req, res, next) => {
  try {
    const { email, password, name, nickname, selfIntroduction } = req.body;
    const isExistEmail = await prisma.users.findFirst({
      //db의 이메일:body의 이메일
      where: {
        email,
      },
    });
    if (isExistEmail) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        status: HTTP_STATUS.CONFLICT,
        message: MESSAGES.AUTH.SIGN_UP.IS_EXIST,
      });
    }

    const hashedPassword = await bycrpt.hash(password, 10);

    const userInfo = await prisma.$transaction(
      async (tx) => {
        const user = await tx.users.create({
          data: {
            email,
            password: hashedPassword,
          },
          select: {
            userId: true,
            email: true,
          },
        });
        const userInfo = await tx.userInfos.create({
          data: {
            UserId: user.userId,
            name,
            nickname,
            selfIntroduction,
          },
          select: {
            name: true,
            role: true,
            nickname: true,
            selfIntroduction: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return { ...user, ...userInfo };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.AUTH.SIGN_UP.SUCCEED,
      data: { userInfo },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
