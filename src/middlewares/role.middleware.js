import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';

// 특정 역할만 접근가능
const requireRoles = function (requireRole) {
  return async function (req, res, next) {
    try {
      const { UserId, role } = req.user;
      if (!requireRole.includes(role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: HTTP_STATUS.FORBIDDEN,
          message: MESSAGES.ROLE.FORBIDDEN,
        });
      }

      req.user = { UserId, role };
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
        const { UserId, role } = req.user;
        if (requireRole.includes(role)) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            status: HTTP_STATUS.FORBIDDEN,
            message: MESSAGES.ROLE.FORBIDDEN,
          });
        }
  
        req.user = { UserId, role };
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
