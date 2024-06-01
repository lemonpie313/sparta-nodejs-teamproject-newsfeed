import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import {
  signUpValidator,
  signInValidator,
} from '../middlewares/joi/auth.joi.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import bycrpt from 'bcrypt';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

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
        const user = await tx.Users.create({
          data: {
            email,
            password: hashedPassword,
          },
          select: {
            userId: true,
            email: true,
          },
        });
        const userInfo = await tx.UserInfos.create({
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

//로그인
router.post('/sign-in', signInValidator, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //회원정보 가져오기
    const user = await prisma.Users.findFirst({
      where: {
        email,
      },
      select: {
        userId: true,
        password: true,
      },
    });
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.AUTH.SIGN_IN.IS_NOT_EXIST,
      });
    }

    //입력받은것, 저장되어있는것
    if (!(await bycrpt.compare(password, user.password))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: HTTP_STATUS.BAD_REQUEST,
        message: MESSAGES.AUTH.SIGN_IN.PW_NOT_MATCHED,
      });
    }

    const payload = { id: user.userId };
    const data = await token(payload);

    res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.SIGN_IN.SUCCEED,
      data,
    });
  } catch (err) {
    next(err);
  }
});

const token = async function (payload) {
  const userId = payload.id;
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY, {
    expiresIn: '12h',
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET_KEY, {
    expiresIn: '7d',
  });

  const refreshTokenHashed = await bycrpt.hash(refreshToken, 10);

  await prisma.RefreshToken.upsert({
    where: {
      userId,
    },
    update: {
      token: refreshTokenHashed,
    },
    create: {
      userId,
      token: refreshTokenHashed,
    },
  });

  return { accessToken, refreshToken };
};

export default router;
