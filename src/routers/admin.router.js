import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { initValidator } from '../middlewares/joi/admin.joi.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { ROLE } from '../const/role.const.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';
import { signUpArtistValidator } from '../middlewares/joi/admin.joi.middleware.js';
import { toS3 } from '../middlewares/multer.middleware.js';

const router = express.Router();

// 초기 셋팅 기능..
router.post('/init', initValidator, async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, name } = req.body;
    const [nickname, selfIntroduction] = ['admin', 'admin'];

    const hashedPassword = await bcrypt.hash(password, 10);
    const group = await prisma.groups.findFirst({
      where: {
        groupName: ROLE.ADMIN,
      },
    });
    if (group) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        status: HTTP_STATUS.CONFLICT,
        message: MESSAGES.ADMIN.INIT.NOT_AVAILABLE,
      });
    }
    if (password != passwordConfirm) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: HTTP_STATUS.BAD_REQUEST,
        message: MESSAGES.ADMIN.INIT.PW_NOT_MATCHED,
      });
    }
    const userInfo = await prisma.$transaction(
      async (tx) => {
        const admin = await tx.groups.create({
          data: {
            groupName: ROLE.ADMIN,
            numOfMembers: 1,
            groupLogo: process.env.DEFAULT_PROFILE_PICTURE,
            groupPicture: process.env.DEFAULT_PROFILE_PICTURE,
          },
        });
        const fan = await tx.groups.create({
          data: {
            groupName: ROLE.FAN,
            numOfMembers: 0,
            groupLogo: process.env.DEFAULT_PROFILE_PICTURE,
            groupPicture: process.env.DEFAULT_PROFILE_PICTURE,
          },
        });
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
            Role: admin.groupId,
            selfIntroduction,
            profilePicture: process.env.DEFAULT_PROFILE_PICTURE,
          },
          select: {
            name: true,
            Role: true,
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
      message: MESSAGES.ADMIN.INIT.SUCCEED,
      data: { userInfo },
    });
  } catch (err) {
    next(err);
  }
});

//아티스트 계정 생성 - 관리자 계정으로 들어가서 계정을 만들 수 있음 > 인증 + 역할인가 필요
router.post(
  '/sign-up/artists',
  authMiddleware,
  requireRoles([ROLE.ADMIN]),
  toS3.single('file'),
  signUpArtistValidator,
  async (req, res, next) => {
    try {
      const { email, artistId, password, name, nickname, selfIntroduction } =
        req.body;
      const file = req.file;
      if (!file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.ADMIN.SIGN_UP_ARTIST.PROFILE_PICTURE.REQUIRED,
        });
      }
      const isExistEmail = await prisma.users.findFirst({
        //db의 이메일:body의 이메일
        where: {
          email,
        },
      });
      if (isExistEmail) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: HTTP_STATUS.CONFLICT,
          message: MESSAGES.ADMIN.SIGN_UP_ARTIST.NOT_AVAILABLE,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const group = await prisma.groups.findFirst({
        where: {
          groupId: +artistId,
        },
      });
      if (!group) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: HTTP_STATUS.NOT_FOUND,
          message: MESSAGES.ADMIN.SIGN_UP_ARTIST.ARTIST_ID.IS_NOT_EXIST,
        });
      }

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
              Role: group.groupId,
              selfIntroduction,
              profilePicture: file.location,
            },
            select: {
              name: true,
              Role: true,
              nickname: true,
              selfIntroduction: true,
              profilePicture: true,
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
        message: MESSAGES.ADMIN.SIGN_UP_ARTIST.SUCCEED,
        data: { userInfo },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
