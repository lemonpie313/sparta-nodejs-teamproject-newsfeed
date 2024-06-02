import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import {
  postValidator,
  postEditValidator,
} from '../middlewares/joi/posts.joi.middleware.js';
import { GROUP } from '../const/group.const.js';

const router = express.Router();

//게시물 작성
router.post(
  '/:group',
  authMiddleware,
  postValidator,
  async (req, res, next) => {
    try {
      const { postContent, postPicture, keywords } = req.body;
      const { group } = req.params;
      const { UserId } = req.user;

      //이미지가 유효한지 (jpg, png 등...)
      if (postPicture) {
        postPicture.forEach((i) => {
          console.log('검사할것: ' + i);
          const ext = i.replace(/(\w|-)+./, '');
          if (!['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov'].includes(ext)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
              status: HTTP_STATUS.BAD_REQUEST,
              message: MESSAGES.POSTS.CREATE.POST_PICTURE.INVALID_FORMAT,
            });
          }
        });
      }

      //그룹 이름 검사
      if (!Object.values(GROUP).includes(group)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: HTTP_STATUS.NOT_FOUND,
          message: MESSAGES.POSTS.CREATE.GROUP.INVALID,
        });
      }

      //데이터 분리 없이 그대로 진행할 경우
      const post = await prisma.posts.create({
        data: {
          group,
          UserId: +UserId,
          postContent,
          postPicture: postPicture ?? [],
          keywords: keywords ?? [],
        },
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: MESSAGES.POSTS.CREATE.SUCCEED,
        data: {
          post,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// 내 게시물 목록 조회
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // 1. 받아온 req.user에서 userId 가져온다.
    const { UserId } = req.user;

    // 2. 로그인한 사용자의 게시물 목록만 조회한다.
    const posts = await prisma.posts.findMany({
      where: {
        UserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // 3. 결과 반환한다.
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.POSTS.READ.SUCCEED,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:postId',
  authMiddleware,
  postEditValidator,
  async (req, res, next) => {
    try {
      const { postId } = req.params;
      const { UserId } = req.user;
      const { postContent, postPicture, keywords } = req.body;

      //이미지가 유효한지 (jpg, png 등...)
      if (postPicture) {
        postPicture.forEach((i) => {
          console.log('검사할것: ' + i);
          const ext = i.replace(/(\w|-)+./, '');
          if (!['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov'].includes(ext)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
              status: HTTP_STATUS.BAD_REQUEST,
              message: MESSAGES.POSTS.CREATE.POST_PICTURE.INVALID_FORMAT,
            });
          }
        });
      }

      const findPost = await prisma.posts.findFirst({
        where: {
          UserId,
          postId: +postId,
        },
      });
      if (!findPost) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: HTTP_STATUS.FORBIDDEN,
          message: MESSAGES.POSTS.UPDATE.IS_NOT_EXIST,
        });
      }

      const myPost = await prisma.posts.update({
        data: {
          UserId: +UserId,
          postContent,
          postPicture,
          keywords,
        },
        where: {
          UserId: +UserId,
          postId: +postId,
        },
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: MESSAGES.POSTS.UPDATE.SUCCEED,
        data: {
          post: myPost,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
