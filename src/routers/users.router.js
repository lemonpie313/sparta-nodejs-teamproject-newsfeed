import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { MESSAGES } from '../const/messages.const.js';
import { userInfoUpdateValidator } from '../middlewares/joi/users.joi.middleware.js';
import bycrpt from 'bcrypt';

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    
    const { UserId } = req.user;
    console.log(UserId);
    const user = await prisma.Users.findFirst({
      where: {
        userId: UserId,
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
      message: MESSAGES.USERS.READ.SUCCEED,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

//이메일을 바꾸는게 맞나?
router.patch(
  '/',
  authMiddleware,
  userInfoUpdateValidator,
  async (req, res, next) => {
    try {
      const { userId, role } = req.user;
      const { name, nickname, selfIntroduction, profilePicture, password } =
        req.body;

      const user = await prisma.Users.findFirst({
        where: {
          userId,
        },
        select: {
          userId: true,
          password: true,
        },
      });
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: HTTP_STATUS.NOT_FOUND,
          message: MESSAGES.USERS.UPDATE.IS_NOT_EXIST,
        });
      }

      if (!(await bycrpt.compare(password, user.password))) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.USERS.UPDATE.PW_NOT_MATCHED,
        });
      }

      const myInfo = await prisma.userInfos.update({
        data: {
          name,
          nickname,
          selfIntroduction,
          profilePicture,
        },
        where: {
          UserId: user.userId,
        },
        select: {
          name: true,
          nickname: true,
          selfIntroduction: true,
          profilePicture: true,
          updatedAt: true,
        },
      });

      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.USERS.UPDATE.SUCCEED,
        data: { myInfo },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
