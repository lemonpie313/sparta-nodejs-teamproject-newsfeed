import express from 'express';
import * as authRouter from './auth.router.js';
import * as commentsRouter from './comments.router.js';
import * as postsRouter from './posts.router.js';
import * as usersRouter from './users.router.js'

const apiRouter = express.Router();

apiRouter.use('/auth', [authRouter]);
apiRouter.use('/users', [usersRouter]);
apiRouter.use('/posts', [postsRouter]);
apiRouter.use('/comments', [commentsRouter]);


export { apiRouter };

//그룹핑 이유 : app.js에는 중요한 정보들이 있으므로 최대한 간결하게?