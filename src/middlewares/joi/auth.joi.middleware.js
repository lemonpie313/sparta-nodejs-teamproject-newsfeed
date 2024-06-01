import Joi from 'joi';
import { MESSAGES } from '../../const/messages.const.js';
//검증할 수 있는 틀
const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
    'string.email': MESSAGES.AUTH.COMMON.EMAIL.INVALID_FORMAT,
  }),
  password: Joi.string().required().min(6).messages({
    'any.required': MESSAGES.AUTH.COMMON.PASSWORD.REQUIRED,
    'string.min': MESSAGES.AUTH.COMMON.PASSWORD.MIN_LENGTH,
  }),
  name: Joi.string().required().message({
    'any.required': MESSAGES.AUTH.COMMON.NAME.REQUIRED,
  }),
  nickname: Joi.string().required().message({
    'any.required': MESSAGES.AUTH.COMMON.NICKNAME.REQUIRED,
  }),
  selfIntroduction: Joi.string().required().message({
    'any.required': MESSAGES.AUTH.COMMON.SELF_INTRODUCTION.REQUIRED,
  }),
});
//검증하는 곳
const signUpValidator = async (req, res, next) => {
  try {
    await signUpSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export { signUpValidator };
