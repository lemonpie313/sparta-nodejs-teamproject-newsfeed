import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { initValidator } from '../middlewares/joi/admin.joi.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { ROLE } from '../const/role.const.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import refreshTokenMiddleware from '../middlewares/refresh-token.middleware.js';
import { ARTIST_ID } from '../const/artistId.const.js';
import { requireRoles, exceptRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// 초기 셋팅 기능..
router.post('/init', initValidator, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const [nickname, selfIntroduction] = ['admin', 'admin'];

    const hashedPassword = await bcrypt.hash(password, 10);
    const group = await prisma.groups.findFirst({
        where: {
            groupName: ROLE.ADMIN
        }
    });
    if (group) {
        return res.status(HTTP_STATUS.CONFLICT).json({
            status: HTTP_STATUS.CONFLICT,
            message: '불가능',
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
      message: '완료',
      data: { userInfo },
    });
  } catch (err) {
    next(err);
  }
});

//그룹 추가 기능
router.post('/group', authMiddleware, requireRoles([ROLE.ADMIN]), async (req, res, next) => {
  try {
    const { groupName, numOfMembers } = req.body;
    
    const group = await prisma.groups.findFirst({
      where: {
        groupName,
      }
    });
    if (group) {
      return res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CONFLICT,
        message: 'already',
      });
    }

    const newGroup = await prisma.groups.create({
      data: {
        groupName,
        numOfMembers,
      }
    })

      return res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: 'good',
        data: newGroup,
      });
  } catch (err) {
    next(err);
  }
  
  
  
});

export default router;
