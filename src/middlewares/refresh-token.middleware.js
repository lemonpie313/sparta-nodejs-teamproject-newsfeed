import jwt from 'jsonwebtoken';
import bcyrpt from 'bcrypt';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { prisma } from '../utils/prisma/index.js';
import dotEnv from 'dotenv';

dotEnv.config();
//

export default async function (req, res, next) {
    try {
      //인증정보 파싱
        const authorization = req.headers.authorization;
        //authorization 없는 경우
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
      
      //튜터님 강의~
      let payload;
      try {
        //jwt 유효한지
        payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);
      } catch (err) {
        //refreshToken유효시간 지난 경우
        if (error.name === 'TokenExpiredError') {
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
          })
        }
       
      }
      //userid가 페이로드에 담겨있음 => id로 조회할것
      const { id } = payload;
      //db에 저장된 refreshtoken이 없거나 전달받은 값과 일치하지 않는 경우
      //1. db에서 refreshtoken 조회
      const existRefreshToken = await prisma.refreshToken.findUnique({
        where: {
          //페이로드 사용해서 조회
          userId: id,
        }
      })
      //2. 넘겨받은 refreshtoken과 비교 ; refresh 토큰자체가 db에 있어야 하므로 && existRefreshToken안에 리프레쉬 토큰 있어야함
      //옵셔널 체이닝을 이용해서 const isValidRefreshToken = existRefreshToken && existRefreshToken.refreshToken 정리하기
      //existRefreshToken이 있을 때에만 리프레쉬토큰 접근 가능 (없으면 false)
      //dbdp 있는 리프레쉬와 넘겨받은 리프레쉬와 비교 = bcrypt ; 사용하려면 위에 import
      //bcrypt.compareSync()로 플레인 먼저 입력
      //플레인: 받아온 refreshToken, 해쉬된 existRefreshToken의 refreshtoken
      const isValidRefreshToken = existRefreshToken?.refreshToken && bcrypt.compareSync(refreshToken, existRefreshToken.refreshToken);

      if (!isValidRefreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.DISCARDED_TOKEN,
        });
      }
      
      //3.payload에 담긴 사용자 id와 일치하는 사용자가 없는 경우
      
      const user = await prisma.user.findFirst({
        where: { id },
        omit: { password: true },
      });

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.NO_MATCH,
        });
      }
      //사용자 정보 넘겨줌
      req.user = user;
      //~튜터님 강의
      
      
      
      
      
      
      
      
      
      
      
      
      
      //수현님 도움받은 코드
      
    //리프레쉬 토큰과, 리프레쉬 시크릿키를 넣어 jwt에서 확인가능
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET_KEY
    );
      const userId = decodedToken.id;
      console.log(userId);
//userid 추출
    
      
      //리프레시 토큰 데이터베이스 안에서 //유저아이디 일치하는것 findfirst

      //해시된 토큰과 유저의 토큰을 bcrypt로 비교

      //일치하지 않으면 에러

      //토큰 일치시 해당 정보를 들고옴
     const user = await prisma.userInfos.findFirst({
        where: { UserId: +userId },
        select: {
          UserId: true,
          role: true,
        },
      });
          // console.log(where);
        
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.NO_MATCH,
        });
      }

        req.user = user;
        // console.log(user)
    next();
  } catch (err) {
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
