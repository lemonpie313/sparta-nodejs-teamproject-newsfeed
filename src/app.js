import express from 'express';
import dotEnv from 'dotenv';
import { apiRouter } from './routers/index.router.js';
import errorHandler from './middlewares/error-handler.middleware.js';
import refreshTokenMiddleware from './middlewares/refresh-token.middleware.js';

dotEnv.config();
const app = express();
const PORT = 3000; // 서버를 열 때 사용할 포트 번호

app.use(express.json());

app.get('/', (req, res) => {
  res.send('루트!!');
});

app.use('/api', apiRouter);

app.use(refreshTokenMiddleware);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
