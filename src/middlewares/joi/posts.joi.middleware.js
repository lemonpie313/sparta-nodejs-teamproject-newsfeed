import Joi from 'joi';
import { MESSAGES } from '../../const/messages.const.js';



const postSchema = Joi.object({
  postContent: Joi.string().required().messages({
    'any.required': MESSAGES.POSTS.CREATE.POST_CONTENT.REQUIRED,
  }),
  keywords: Joi.string().max(10).messages({
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

export { postValidator };

// if (!postPicture) {
//     return res.status(HTTP_STATUS.BAD_REQUEST).json({
//         status: HTTP_STATUS.BAD_REQUEST,
//         message: MESSAGES.POSTS.CREATE.NO_POSTPICTURE,
//     });
// }
