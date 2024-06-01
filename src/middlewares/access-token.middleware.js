import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { prisma } from '../utils/prisma';

export default async function (req, res, next) {
  try {
    const authorization = rea.headers.authorization;
    if (!authorization) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.JWT.NONE });
    }
    const [tokenType, accessToken] = authorization.split(' ');
    if (tokenType !== 'Bearer') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.JWT.NOT_TYPE,
      });
    }
    if (!accessToken) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.JWT.NONE });
    }

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET_KEY
    );
    const userId = decodedToken.id;

    const user = await prisma.userInfos.findFirst({
      where: { userId: +userId },
      select: {
        userId: true,
        role: true,
      },
    });

    if (!user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.JWT.NO_MATCH,
        });
    }
    req.user = user;
    next();
  } catch (err) {
    switch (err.name) {
      case 'TokenExpiredError':
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: MESSAGES.JWT.EXPIRED,
          });
      case 'JsonWebTokenError':
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({
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
