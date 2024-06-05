import express from 'express';
import authRouter from './auth.router.js';
import usersRouter from './users.router.js';
import postsRouter from './posts.router.js';
import commentsRouter from './comments.router.js';
import multimediaRouter from './multimedia.router.js';

const apiRouter = express.Router();

apiRouter.use('/auth', [authRouter]);
apiRouter.use('/users', [usersRouter]);
apiRouter.use('/posts', [postsRouter]);
apiRouter.use('/comments', [commentsRouter]);
apiRouter.use('/multimedia', [multimediaRouter]);

export { apiRouter };
