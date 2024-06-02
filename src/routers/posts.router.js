import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import {
  postValidator,
  postEditValidator,
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

// 게시물 상세 조회
router.get('/:postId', authMiddleware, async (req, res, next) => {
  try {
    // 1. postId 받아오기
    const { postId } = req.params;

    // 2. 로그인한 사용자의 게시물을 조회한다.
    const detailPost = await prisma.posts.findUnique({
		where: {
			postId: +postId,
		},
		select: {
			postId: true,
			postContent: true,
			postPicture: true,
			keywords: true,
			createdAt: true,
			updatedAt: true,
			User: {
				select: {
					UserInfos: {
						select: {
							nickname: true,
							UserId: true
						}
					}
				}
			}
		}
	});


    // 3. 게시물 번호가 있는지 확인해서 없으면 오류 반환
    //
    if (detailPost === null) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.POSTS.READ.IS_NOT_EXIST,
      });
    }
    // 3. 게시물 번호가 있는지 확인해서 없으면 오류 반환
    //
    if (detailPost === null) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.POSTS.READ.IS_NOT_EXIST,
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.POSTS.READ.SUCCEED,
      data: detailPost,
    });
  } catch (err) {
    next(err);
  }
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.POSTS.READ.SUCCEED,
      data: detailPost,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:postId', authMiddleware, async (req, res, next) => {
  try {
    //유저 아이디를 req.user에서 가져옴
    const { UserId } = req.user;

    //포스트 아이디를 req.params에서 가져옴
    const { postId } = req.params;

    //해당 게시물이 존재 하는지 검사 params에서 가져온 id = post에서 가져온 id 일치인지
    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    
    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.POSTS.DELETE.NO_POSTID,
      });
    }
    //로그인한 유저id와 게시물 작성한 유저id가 같은지 확인
    // if (UserId !== post.userId) {
    //   return res.status(HTTP_STATUS.ERROR).json({
    //     message: MESSAGES.POSTS.DELETE.POST_ID_NOT_MATCHED,
    //   });
    // }
	
    await prisma.posts.delete({
      where: { postId: +postId },
    });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.POSTS.DELETE.SUCCEED,
      data: { postId: postId },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
