import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { MESSAGES } from '../const/messages.const.js';
import {
  userInfoUpdateValidator,
  passwordUpdateValidator,
} from '../middlewares/joi/users.joi.middleware.js';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { requireRoles } from '../middlewares/role.middleware.js';
import { ROLE } from '../const/role.const.js';
import { toS3 } from '../middlewares/multer.middleware.js';

const router = express.Router();

// 회원정보 조회 - 리팩토링 완료
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { UserId } = req.user;
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

// 내 정보 수정 API
router.patch(
  '/',
  authMiddleware,
  toS3.single('file'),
  userInfoUpdateValidator,
  async (req, res, next) => {
    try {
      const { UserId } = req.user;
      const { name, nickname, selfIntroduction, profilePicture, password } =
        req.body;
      const file = req.file;
      const user = await prisma.Users.findFirst({
        where: {
          userId: UserId,
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
      console.log(await bcrypt.compare(password, user.password));
      console.log(user.password);
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.USERS.UPDATE.PW_NOT_MATCHED,
        });
      }
      const previousInfo = await prisma.userInfos.findFirst({
        where: {
          UserId,
        },
      });

      const myInfo = await prisma.userInfos.update({
        data: {
          name,
          nickname,
          selfIntroduction,
          profilePicture: file ? file.location : previousInfo.profilePicture,
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
// 다른 사람 프로필 조회 -- 리팩토링 (Role, Group 대문자..)
router.get('/:userInfoId', authMiddleware, async (req, res, next) => {
  // 1. userInfoId 받아오기
  const { userInfoId } = req.params;
  const { UserId } = req.user;

  // 2. 테이블에서 해당 조건 값 가져오기
  const profile = await prisma.userInfos.findUnique({
    where: {
      userInfoId: +userInfoId,
    },
    select: {
      userInfoId: true,
      Role: true,
      nickname: true,
      selfIntroduction: true,
      profilePicture: true,
      createdAt: true,
      updatedAt: true,
      User: {
        select: {
          Posts: {
            select: {
              postId: true,
              postContent: true,
              Group: true,
            },
          },
        },
      },
    },
  });

  // 3. 관리자 프로필에 접근 못하게 하기
  const role = await prisma.groups.findFirst({
    where: {
      groupName: ROLE.ADMIN,
    },
  });

  if (profile.Role == role.groupName) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      status: HTTP_STATUS.FORBIDDEN,
      message: MESSAGES.USERS.READ.INACCESSIBLE,
    });
  }

  // 3. 오류 처리 반환
  if (!profile) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      status: HTTP_STATUS.NOT_FOUND,
      message: MESSAGES.USERS.READ.IS_NOT_EXIST,
    });
  }
  // 4. 성공 처리 반환
  return res.status(HTTP_STATUS.OK).json({
    status: HTTP_STATUS.OK,
    message: MESSAGES.USERS.READ.SUCCEED,
    data: profile,
  });
});

// 비밀번호 수정 API >> 얘 왜 안되냐고...
router.patch(
  '/password',
  authMiddleware,
  passwordUpdateValidator,
  async (req, res, next) => {
    try {
      // 1. 필요한 정보 가져오기
      // 1-1. req.user에서 UserId 가져오기
      const { UserId } = req.user;
      // 1-2. req.body에서 클라이언트로부터 입력된 값 받아오기
      const { password, newPassword, newPasswordConfirm } = req.body;

      // 2. 비밀번호 관련 검사
      // 2-1. 입력된 newPassword와 newPasswordConfirm이 일치하는가?
      if (newPassword !== newPasswordConfirm) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.USERS.PW_UPDATE.NEW_PW_NOT_MATCHED,
        });
      }
      // 2-2. password가 UserId를 가지고 찾은 회원의 password와 일치하는가?
      const user = await prisma.Users.findFirst({
        where: {
          userId: UserId,
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
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.USERS.PW_UPDATE.PW_NOT_MATCHED,
        });
      }
      if (await bcrypt.compare(newPassword, user.password)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.USERS.PW_UPDATE.SAME_PASSWORD,
        });
      }

      // 3. 새 비밀번호로 변경
      // 3-1. 새 비밀번호를 hash해줌
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // 3-2. 새 비밀번호로 업데이트 해줌
      const passwordChange = await prisma.users.update({
        data: {
          password: hashedPassword,
        },
        where: {
          userId: user.userId,
        },
      });

      //4. 비밀번호 변경 결과를 클라이언트에 반환
      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.USERS.PW_UPDATE.SUCCEED,
        data: {
          userId: user.userId,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// 팔로우 하기 -- 리팩토링함(schema 바뀜...)
router.patch(
  '/follow/:userId',
  authMiddleware,
  requireRoles([ROLE.FAN]),
  async (req, res, next) => {
    try {
      // 1. 팔로우 할 아이디(상대) 가져오기
      const { userId } = req.params;
      // 1-1. 팔로우 할려고 하는 사람(자신)의 ID 가져오기
      const { UserId } = req.user;

      if (UserId == +userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.USERS.FOLLOW.SELF_IMPOSSIBLE,
        });
      }
      if (+userId == 1) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.USERS.FOLLOW.IMPOSSIBLE,
        });
      }

      // 2. 팔로우 할 유저가 있는지 조회
      const follower = await prisma.users.findFirst({
        where: {
          userId: +userId,
        },
      });

      // 3. 오류 처리
      if (!follower) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: HTTP_STATUS.NOT_FOUND,
          message: MESSAGES.USERS.FOLLOW.IS_NOT_EXIST,
        });
      }
      // 4. 팔로우가 되어있는지 확인
      const AlreadyFollowing = await prisma.followers.findFirst({
        where: {
          FollowerUserId: UserId,
          Followings: {
            FollowingUserId: +userId,
          },
        },
        select: {
          followerId: true,
          FollowerUserId: true,
        },
      });

      // 4-1. 이미 있다면 삭제
      if (AlreadyFollowing) {
        await prisma.$transaction(
          async (tx) => {
            await tx.followers.delete({
              where: {
                followerId: AlreadyFollowing.followerId,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          }
        );

        return res.status(HTTP_STATUS.OK).json({
          status: HTTP_STATUS.OK,
          message: MESSAGES.USERS.FOLLOW.UNFOLLOW_SUCCEED,
        });
      }

      // 5. following 데이터베이스에 추가
      await prisma.$transaction(
        async (tx) => {
          const following = await tx.followers.create({
            data: {
              FollowerUserId: UserId,
            },
          });
          await tx.followings.create({
            data: {
              FollowerId: following.followerId,
              FollowingUserId: +userId,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      // 성공 처리 반환
      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.USERS.FOLLOW.FOLLOW_SUCCEED,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
