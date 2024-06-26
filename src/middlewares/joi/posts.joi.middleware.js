import Joi from 'joi';
import { MESSAGES } from '../../const/messages.const.js';

const postSchema = Joi.object({
  postContent: Joi.string().required().messages({
    'any.required': MESSAGES.POSTS.CREATE.POST_CONTENT.REQUIRED,
    'string.empty': MESSAGES.POSTS.UPDATE.NO_CONTENT,
  }),
});

const postEditSchema = Joi.object({
  postContent: Joi.string().min(1).messages({
    'string.empty': MESSAGES.POSTS.UPDATE.NO_CONTENT,
  }),
});

const postValidator = async (req, res, next) => {
  try {
    await postSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

const postEditValidator = async (req, res, next) => {
  try {
    await postEditSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export { postValidator, postEditValidator };
