import Joi from 'joi';
import { MESSAGES } from '../../const/messages.const.js';

const userInfoUpdateSchema = await Joi.object({
  //   email: Joi.string().email().messages({
  //     'string.email': MESSAGES.AUTH.COMMON.EMAIL.INVALID_FORMAT,
  //   }),
  password: Joi.string().required().min(6).messages({
    'any.required': MESSAGES.AUTH.COMMON.PASSWORD.REQUIRED,
    'string.min': MESSAGES.AUTH.COMMON.PASSWORD.MIN_LENGTH,
  }),
  name: Joi.string().messages({
    'string.empty': MESSAGES.USERS.UPDATE.NAME.EMPTY,
  }),
  nickname: Joi.string().messages({
    'string.empty': MESSAGES.USERS.UPDATE.NICKNAME.EMPTY,
  }),
  selfIntroduction: Joi.string().messages({
    'string.empty': MESSAGES.USERS.UPDATE.SELF_INTRODUCTION.EMPTY,
  }),
  profilePicture: Joi.array(),
});

const userInfoUpdateValidator = async (req, res, next) => {
  try {
    await userInfoUpdateSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export { userInfoUpdateValidator };
