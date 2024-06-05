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

const router = express.Router();

// 초기 셋팅 기능..
router.post('/init', initValidator, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
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
    const userInfo = await prisma.$transaction(
      async (tx) => {
        const admin = await tx.groups.create({
          data: {
            groupName: ROLE.ADMIN,
            numOfMembers: 1,
          },
        });
        const fan = await tx.groups.create({
          data: {
            groupName: ROLE.FAN,
            numOfMembers: 0,
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
            profilePicture: 'image.jpg',
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

//그룹 추가 기능
router.post(
  '/group',
  authMiddleware,
  requireRoles([ROLE.ADMIN]),
  async (req, res, next) => {
    try {
      const { groupName, numOfMembers } = req.body;

      const group = await prisma.groups.findFirst({
        where: {
          groupName,
        },
      });
      if (group) {
        return res.status(HTTP_STATUS.CREATED).json({
          status: HTTP_STATUS.CONFLICT,
          message: MESSAGES.ADMIN.CREATE_GROUP.IS_EXIST,
        });
      }

      const newGroup = await prisma.groups.create({
        data: {
          groupName,
          numOfMembers,
        },
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: MESSAGES.ADMIN.CREATE_GROUP.SUCCEED,
        data: newGroup,
      });
    } catch (err) {
      next(err);
    }
  }
);

//그룹수정
router.patch(
  '/group/:groupId',
  authMiddleware,
  requireRoles([ROLE.ADMIN]),
  async (req, res, next) => {
    try {
      const { groupId } = req.params;
      const { groupName, numOfMembers } = req.body;
      const group = await prisma.groups.findFirst({
        where: {
          groupId: +groupId,
        },
      });

      if (!group) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: HTTP_STATUS.NOT_FOUND,
          message: MESSAGES.ADMIN.UPDATE_GROUP.IS_NOT_EXIST,
        });
      }

      const updatedGroup = await prisma.groups.update({
        data: {
          groupName,
          numOfMembers,
        },
        where: {
          groupId: +groupId,
        },
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: MESSAGES.ADMIN.UPDATE_GROUP.SUCCEED,
        data: updatedGroup,
      });
    } catch (err) {
      next(err);
    }
  }
);

//그룹 삭제
router.delete(
  '/group/:groupId',
  authMiddleware,
  requireRoles([ROLE.ADMIN]),
  async (req, res, next) => {
    try {
      const { groupId } = req.params;
      const { groupName, numOfMembers } = req.body;
      const group = await prisma.groups.findFirst({
        where: {
          groupId: +groupId,
        },
      });

      if (!group) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: HTTP_STATUS.NOT_FOUND,
          message: MESSAGES.ADMIN.DELETE_GROUP.IS_NOT_EXIST,
        });
      }

      const artist = await prisma.userInfos.findMany({
        where: {
          Role: group.groupId,
        },
      });

      if (artist) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: HTTP_STATUS.FORBIDDEN,
          message: MESSAGES.ADMIN.DELETE_GROUP.ARTIST_EXIST,
        });
      }

      const deletedGroup = await prisma.groups.delete({
        where: {
          groupId: +groupId,
        },
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: MESSAGES.ADMIN.DELETE_GROUP.SUCCEED,
        data: deletedGroup.groupId,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
