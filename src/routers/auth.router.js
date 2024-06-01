import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { signUpValidator } from '../middlewares/joi/auth.joi.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import bycrpt from 'bcrypt';

const router = express.Router();

//회원가입
router.post('/sign-up', signUpValidator, async (req, res, next) => {
  try {
    const { email, password, name, nickname, selfIntroduction } = req.body;
    const isExistEmail = await prisma.users.findFirst({
      //db의 이메일:body의 이메일
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

    const hashedPassword = await bycrpt.hash(password, 10);

    return res.status(200).json('sign-up');
  } catch (err) {
    next(err);
  }
});

export default router;
