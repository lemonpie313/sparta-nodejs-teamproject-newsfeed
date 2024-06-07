import dotEnv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { prisma } from '../utils/prisma/index.js';
dotEnv.config();

//

export default async function (req, res, next) {
  try {
    //인증정보 파싱
    const authorization = req.headers.authorization;
    //authorization 없는 경우
    console.log('authorization에 담긴것', authorization);
    if (!authorization) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.JWT.NONE });
    }
    //토큰형식이 일치하지 않는 경우
    const [tokenType, refreshToken] = authorization.split(' ');
    if (tokenType !== 'Bearer') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.JWT.NOT_TYPE,
      });
    }
    //refreshToken이 없는 경우
    if (!refreshToken) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.JWT.NONE });
    }

    let payload;
    try {
      //jwt 유효한지
      console.log(
        'REFRESH_TOKEN_SECRET_KEY에 담긴것',
        process.env.REFRESH_TOKEN_SECRET_KEY
      );
      console.log('refreshToken에 담긴것', refreshToken);
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);
    } catch (err) {
      //refreshToken유효시간 지난 경우
      if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.EXPIRED,
        });
      }
      //그밖에 검증 실패한 경우
      else {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.NOT_AVAILABLE,
        });
      }
    }
    //userid가 페이로드에 담겨있음 => id로 조회할것
    const { id } = payload;
    console.log('id에 담긴것', id, 'payload에 담긴것', payload);
    //db에 저장된 refreshtoken이 없거나 전달받은 값과 일치하지 않는 경우
    //1. db에서 refreshtoken 조회 prisma에 있는 모델명(맨앞 소문자로 자동인식)
    //1.여기에 있는 refreshToken 테이블자체(디비)) 거기서 찾음
    const existRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        //2.페이로드 사용해서 조회 : 유저아이디로 하나의 데이터 찾아서  => existRefreshToken에 담음
        // => existRefreshToken에는 refreshToken 테이블에서 찾은 id에 관한 token 가져옴
        userId: id,
      },
    });
    console.log('existRefreshToken에 담긴 것', existRefreshToken);
    //2. 넘겨받은 refreshtoken과 비교 ; refresh 토큰자체가 db에 있어야 하므로 && existRefreshToken안에 리프레쉬 토큰 있어야함
    //저장된 토큰과 우리가 받은 refresh토큰과 비교
    const isValidRefreshToken =
      existRefreshToken?.token &&
      bcrypt.compareSync(refreshToken, existRefreshToken.token);
    //에러 난 이유 existRefreshToken 에서 값이 저장된 token컬럼을 찾지 않고 없는 refresh컬럼명으로 찾아서
    console.log('isValidRefreshToken--->', isValidRefreshToken);

    console.log('existRefreshToken.token에 담긴 것', existRefreshToken.token);
    if (!isValidRefreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.JWT.DISCARDED_TOKEN,
      });
    }

    //3.payload에 담긴 사용자 id와 일치하는 사용자가 없는 경우

    const user = await prisma.users.findFirst({
      where: { userId: id },
      // omit: { password: true },
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.JWT.NO_MATCH,
      });
    }
    //사용자 정보 넘겨줌
    req.user = user;
    console.log('req.user에 담긴것', req.user);

    next();
  } catch (err) {
    console.log('최하단 캐치', err.name);
    switch (err.name) {
      case 'TokenExpiredError':
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.EXPIRED,
        });
      case 'JsonWebTokenError':
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.NOT_AVAILABLE,
        });
      default:
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: err.message ?? MESSAGES.JWT.ELSE,
        });
    }
  }
}
