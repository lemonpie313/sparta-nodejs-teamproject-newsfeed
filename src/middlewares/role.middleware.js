import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { prisma } from '../utils/prisma/index.js';

// 특정 역할만 접근가능
const requireRoles = function (requireRole) {
  return async function (req, res, next) {
    try {
      const { UserId, Role } = req.user;
      const role = await prisma.groups.findMany({
        where: {
            groupName: {
                in: requireRole,
            },
        }
      });
      const requireId = role.map((cur) => cur.groupId);
      if (!requireId.includes(Role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: HTTP_STATUS.FORBIDDEN,
          message: MESSAGES.ROLE.FORBIDDEN,
        });
      }

      req.user = { UserId, Role };
      return next();
    } catch (err) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        status: HTTP_STATUS.FORBIDDEN,
        message: err.message ?? MESSAGES.ROLE.ERROR,
      });
    }
  };
};

// 특정 역할 제외
const exceptRoles = function (requireRole) {
  return async function (req, res, next) {
    try {
      const { UserId, Role } = req.user;
      if (requireRole.includes(Role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: HTTP_STATUS.FORBIDDEN,
          message: MESSAGES.ROLE.FORBIDDEN,
        });
      }

      req.user = { UserId, Role };
      return next();
    } catch (err) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        status: HTTP_STATUS.FORBIDDEN,
        message: err.message ?? MESSAGES.ROLE.ERROR,
      });
    }
  };
};

export { requireRoles, exceptRoles };
