import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import {
  signUpValidator,
  signUpArtistValidator,
  signInValidator,
} from '../middlewares/joi/auth.joi.middleware.js';
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

//회원가입 - 일반 - 리팩토링중..
router.post('/sign-up', signUpValidator, async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      nickname,
      selfIntroduction,
      profilePicture,
    } = req.body;
    const isExistEmail = await prisma.users.findFirst({
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const group = await prisma.groups.findFirst({
      where: {
        groupName: ROLE.FAN,
      },
    });

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
            profilePicture: profilePicture ?? 'image.jpg',
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
      message: MESSAGES.AUTH.SIGN_UP.SUCCEED,
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
  signUpArtistValidator,
  async (req, res, next) => {
    try {
      const {
        email,
        artistId,
        password,
        name,
        nickname,
        selfIntroduction,
        profilePicture,
      } = req.body;
      const isExistEmail = await prisma.users.findFirst({
        //db의 이메일:body의 이메일
        where: {
          email,
        },
      });
      if (isExistEmail) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: HTTP_STATUS.CONFLICT,
          message: MESSAGES.AUTH.SIGN_UP.NOT_AVAILABLE,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const group = await prisma.groups.findFirst({
        where: {
          groupId: artistId,
        },
      });
      if (!group) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: HTTP_STATUS.NOT_FOUND,
          message: MESSAGES.AUTH.SIGN_UP_ARTIST.ARTIST_ID.IS_NOT_EXIST,
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
              profilePicture: profilePicture ?? 'image.jpg',
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
        message: MESSAGES.AUTH.SIGN_UP_ARTIST.SUCCEED,
        data: { userInfo },
      });
    } catch (err) {
      next(err);
    }
  }
);

//로그인
router.post('/log-in', signInValidator, async (req, res, next) => {
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
    if (!(await bcrypt.compare(password, user.password))) {
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
//
const token = async function (payload) {
  const userId = payload.id;
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY, {
    expiresIn: '12h',
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET_KEY, {
    expiresIn: '7d',
  });

  const refreshTokenHashed = await bcrypt.hash(refreshToken, 10);
  //
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

//토큰 재발급 : authRouter하면 404 엔드포인트 에러, router 로 하면 500 err
router.post('/retoken', refreshTokenMiddleware, async (req, res, next) => {
  try {
    //유저정보 가져오기

    const user = req.user;
    console.log(user);
    const payload = { id: user.userId };
    console.log('payload에 들은것ㅇㅇㅇ', payload);

    console.log(
      'process.env.ACCESS_TOKEN_SECRET_KEY에 담긴 것ooo',
      process.env.ACCESS_TOKEN_SECRET_KEY
    );

    const data = await generateAuthTokens(payload);

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.TOKEN.SUCCEED,
      data,
    });
  } catch (err) {
    next(err);
  }
});

//위의 수식 줄여줌
const generateAuthTokens = async (payload) => {
  const userId = payload.id;
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY, {
    expiresIn: '12h',
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET_KEY, {
    expiresIn: '7d',
  });

  const refreshTokenHashed = await bcrypt.hash(refreshToken, 10);

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

//로그아웃
router.delete('/log-out', refreshTokenMiddleware, async (req, res, next) => {
  try {
    //유저 정보를 받아옴

    const { userId } = req.user;

    const logOutUser = await prisma.refreshToken.delete({
      where: {
        //delete : 삭제하면서 삭제한ㄴ 데이터
        userId: userId,
      },
      select: {
        userId: true,
      },
    });
    console.log('logOutUser', logOutUser);

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.LOGOUT.SUCCEED,
      //사용자 아이디 반환
      //logOutUser에 리프레시 토큰테이블 삭제한 데이터
      data:
        // { id: logOutUser.userId },
        logOutUser,
    });
  } catch (err) {
    next(err);
  }
});
export default router;
//
// export { authRouter };
