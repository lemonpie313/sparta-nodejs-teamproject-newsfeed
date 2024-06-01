import Joi from 'joi';
import { MESSAGES } from '../../const/messages.const.js';

const postSchema = Joi.object({
  postContent: Joi.string().required().messages({
    'any.required': MESSAGES.POSTS.CREATE.POST_CONTENT.REQUIRED,
  }),
  postPicture: Joi.array(),
  keywords: Joi.string().min(0).max(10).messages({
    'string.min': MESSAGES.POSTS.CREATE.KEYWORDS.MAX_LENGTH,
  }),
});

const postEditSchema = Joi.object({
  postContent: Joi.string().min(1),
  postPicture: Joi.array(),
  keywords: Joi.string().min(0).max(10).messages({
    'string.min': MESSAGES.POSTS.CREATE.KEYWORDS.MAX_LENGTH,
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

// if (!postPicture) {
//     return res.status(HTTP_STATUS.BAD_REQUEST).json({
//         status: HTTP_STATUS.BAD_REQUEST,
//         message: MESSAGES.POSTS.CREATE.NO_POSTPICTURE,
//     });
// }
