import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';

export default function (err, req, res, next) {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: HTTP_STATUS.BAD_REQUEST,
      message: err.message,
    });
  }
  return res.status(HTTP_STATUS.ERROR).json({
    status: HTTP_STATUS.ERROR,
    message: "오류",
  });
}
