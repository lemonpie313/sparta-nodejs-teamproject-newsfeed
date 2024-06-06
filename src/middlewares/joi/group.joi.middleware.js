import Joi from 'joi';
import { MESSAGES } from '../../const/messages.const.js';

const signUpSchema = Joi.object({
  groupName: Joi.string().email().required().messages({
    'any.required': MESSAGES.ADMIN.CREATE_GROUP.GROUP_NAME.REQUIRED,
    'string.empty': MESSAGES.ADMIN.CREATE_GROUP.GROUP_NAME.REQUIRED,
  }),
  numOfMembers: Joi.Number().required().min(6).messages({
    'any.required': MESSAGES.ADMIN.CREATE_GROUP.NUM_OF_MEMBERS.REQUIRED,
  }),
});

const signUpValidator = async (req, res, next) => {
    try {
      await signUpSchema.validateAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

  export { signUpValidator };