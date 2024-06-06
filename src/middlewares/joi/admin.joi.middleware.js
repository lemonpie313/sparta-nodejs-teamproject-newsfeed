import Joi from 'joi';
import { MESSAGES } from '../../const/messages.const.js';

const initSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
    'string.empty': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
    'string.email': MESSAGES.AUTH.COMMON.EMAIL.INVALID_FORMAT,
  }),
  password: Joi.string().required().min(6).messages({
    'any.required': MESSAGES.AUTH.COMMON.PASSWORD.REQUIRED,
    'string.empty': MESSAGES.AUTH.COMMON.PASSWORD.MIN_LENGTH,
    'string.min': MESSAGES.AUTH.COMMON.PASSWORD.MIN_LENGTH,
  }),
  name: Joi.string().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.NAME.REQUIRED,
    'string.empty': MESSAGES.AUTH.COMMON.NAME.EMPTY,
  }),
});

const signUpArtistSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
    'string.empty': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
    'string.email': MESSAGES.AUTH.COMMON.EMAIL.INVALID_FORMAT,
  }),
  artistId: Joi.number().required().messages({
    'any.required': MESSAGES.ADMIN.SIGN_UP_ARTIST.ARTIST_ID.REQUIRED,
  }),
  password: Joi.string().required().min(6).messages({
    'any.required': MESSAGES.AUTH.COMMON.PASSWORD.REQUIRED,
    'string.empty': MESSAGES.AUTH.COMMON.PASSWORD.MIN_LENGTH,
    'string.min': MESSAGES.AUTH.COMMON.PASSWORD.MIN_LENGTH,
  }),
  name: Joi.string().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.NAME.REQUIRED,
    'string.empty': MESSAGES.AUTH.COMMON.NAME.EMPTY,
  }),
  nickname: Joi.string().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.NICKNAME.REQUIRED,
    'string.empty': MESSAGES.AUTH.COMMON.NICKNAME.EMPTY,
  }),
  selfIntroduction: Joi.string().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.SELF_INTRODUCTION.REQUIRED,
    'string.empty': MESSAGES.USERS.UPDATE.SELF_INTRODUCTION.EMPTY,
  }),
});

const initValidator = async (req, res, next) => {
  try {
    await initSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};


const signUpArtistValidator = async (req, res, next) => {
  try {
    await signUpArtistSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};


export { initValidator, signUpArtistValidator };
