import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { ROLE } from '../const/role.const.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

//그룹 추가 기능
router.post(
  '/',
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

router.get('/', async (req, res, next) => {
  const group = await prisma.groups.findMany({
    where: {
      NOT: {
        OR: [
          {
            groupName: 'ADMIN',
          },
          {
            groupName: 'FAN',
          },
        ],
      },
    },
  });
  return res.status(HTTP_STATUS.OK).json({
    status: HTTP_STATUS.OK,
    message: '됨',
    data: group,
  });
});

//그룹수정
router.patch(
  '/:groupId',
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
  '/:groupId',
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
