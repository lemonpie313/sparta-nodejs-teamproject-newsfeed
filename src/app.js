import express from 'express';
import dotEnv from 'dotenv';
import authRouter from './routers/auth.router.js';
import usersRouter from './routers/users.router.js';
import postsRouter from './routers/posts.router.js';
import commentsRouter from './routers/comments.router.js';
import errorHandler from './middlewares/error-handler.middleware.js';

dotEnv.config();
const app = express();
const PORT = 3000; // 서버를 열 때 사용할 포트 번호

app.use(express.json());

app.get('/', (req, res) => {
  res.send('루트!!');
});

app.use('/auth', [authRouter]);
app.use('/users', [usersRouter]);
app.use('/posts', [postsRouter]);
app.use('/comments', [commentsRouter]);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
