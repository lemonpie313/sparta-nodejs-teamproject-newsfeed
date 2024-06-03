import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { MESSAGES } from '../const/messages.const.js';

const router = express.Router();

/** 댓글 작성 API **/
router.post('/:postId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 댓글 작성에 필요한 정보 가져오기
    // 1-1. req.body로부터 comment를 받아온다.
    const { comment } = req.body;
    // 1-2. req.params로부터 postId 받아온다.
    const { postId } = req.params;
    console.log(postId);
    // 1-3. req.user로부터 UserId 가져온다.
    const { UserId } = req.user;
    // 2. 만약 댓글을 입력하지 않았다면
    if (!comment) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: HTTP_STATUS.BAD_REQUEST,
        message: MESSAGES.COMMENTS.CREATE.NO_COMMENTS,
      });
    }
    // 3. comments 테이블과 comment_likes 테이블에 데이터 생성
    // 3-1. 작성한 내용을 바탕으로 comments 테이블에 comment 생성
    const newComment = await prisma.comments.create({
      //comment는 위에서 선언해서.. newComment로 선언함
      data: {
        PostId: +postId,
        UserId: +UserId,
        comment,
      },
    });
    // 3-2. 해당 comment와 1:1 관계를 가지는 comment_likes 생성
    const newCommentLike = await prisma.CommentLikes.create({
      data: {
        CommentId: newComment.commentId,
      },
    });
    // 4. 댓글 작성 결과를 클라이언트에 반환
    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.COMMENTS.CREATE.SUCCEED,
      data: newComment,
    });
  } catch (err) {
    next(err);
  }
});

/** 댓글 삭제 API **/
router.delete('/:commentId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 댓글 작성에 필요한 정보 가져오기
    // 1-1. req.params로부터 commentId 받아온다.
    const { commentId } = req.params;
    // 1-2. req.user로부터 UserId 가져온다.
    const { UserId } = req.user;
    // 2. 해당 댓글이 존재하는지 확인
    const comment = await prisma.comments.findFirst({
      where: {
        UserId: +UserId,
      },
    });
    // 3. 만약 댓글이 존재하지 않는다면
    if (!comment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.COMMENTS.DELETE.NO_COMMENTS,
      }); // 이 부분 왜 안되는 것인지 ... 회의시간 ㄱㄱ
    }
    // 4. 댓글 삭제
    await prisma.comments.delete({
      where: {
        commentId: +commentId,
      },
    });
    // 5. 댓글 작성 결과를 클라이언트에 반환
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.COMMENTS.DELETE.SUCCEED,
      data: {
        commentId,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** 댓글 수정 API **/
router.patch('/:commentId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 수정할 때 필요한 자료 가져오기
    // 1-1. req.params로부터 commentId 가져오기
    const { commentId } = req.params;
    // 1-2. req.user로부터 UserId 가져오기
    const { UserId } = req.user;
    // 1-3. req.body로부터 수정된 comment 가져오기
    const { comment: editedComment } = req.body;

    // 2-1. 해당 댓글이 존재하는지 확인
    const comment = await prisma.comments.findFirst({
      where: {
        commentId: +commentId,
      },
    });
    console.log('--------------', comment);
    // 2-2. 댓글이 존재하지 않으면?
    if (!comment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.COMMENTS.UPDATE.NO_COMMENTS,
      });
    }

    // 3. 댓글 수정내용을 입력하지 않았거나, 기존 댓글에서 수정된 내용이 없는 경우
    if (!editedComment || editedComment == comment.comment) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: HTTP_STATUS.BAD_REQUEST,
        message: MESSAGES.COMMENTS.UPDATE.NO_EDIT,
      });
    }

    // 4. 댓글을 수정한다.
    const updatedComment = await prisma.comments.update({
      data: {
        comment: editedComment,
      },
      where: {
        UserId: +UserId,
        commentId: +commentId,
      },
    });

    // 5. 댓글 수정 결과를 클라이언트에 반환
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.COMMENTS.UPDATE.SUCCEED,
      data: updatedComment,
    });
  } catch (err) {
    next(err);
  }
});

/** 내 댓글 목록 조회 API **/
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // 1. req.user로부터 UserId 가져오기
    const { UserId } = req.user;
    // 2. 현재 로그인 한 사용자의 댓글 목록만 조회하기
    const comments = await prisma.comments.findMany({
      select: {
        PostId: true,
        User: {
          select: {
            UserInfos: {
              select: {
                nickname: true,
              },
              where: {
                UserId: +UserId,
              },
            },
          },
        },
        commentId: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        UserId: +UserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // 3. 내 댓글 목록 조회 결과를 클라이언트에 반환
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.COMMENTS.READ.SUCCEED,
      data: comments,
    });
  } catch (err) {
    next(err);
  }
});

/** 댓글 좋아요 API **/
router.patch('/like/:commentId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 필요한 정보들 가져오기
    // 1-1. 좋아요를 누른 사람이 누구인가? req.user에서 가져와!
    const { UserId } = req.user;
    // 1-2. 그리고 이 댓글의 id가 무엇인가? req.params에서 가져와!
    const { commentId } = req.params;
    // 1-3. 이따 좋아요 수 반영을 위해 지금 좋아요 수 가져와!
    // 1-3-1. 만약 commentLike 테이블에
    const { commentLikes: currentLikes } = await prisma.CommentLikes.findFirst({
      where: {
        CommentId: +commentId,
      },
    });
    // 1-4. 이 댓글이 어느 글에 달려있는 것인지 Post_id도 가져와!
    const { PostId } = await prisma.comments.findFirst({
      where: {
        commentId: +commentId,
      },
    });

    // 2. 내가 좋아요 누른 댓글(like_comments) 배열에
    let { likeComments } = await prisma.UserInfos.findFirst({
      where: {
        UserId: +UserId,
      },
    });
    // 2.@ '이 댓글의 comment_id' 가 요소로 있는지 확인
    if (likeComments.includes(+commentId)) {
      // <2-A 만약 있다면> '좋아요 취소' 하는 로직 실행
      // 2-A1. like_comments 배열에서 'comment_id' 요소 삭제
      for (let i = 0; i < likeComments.length; i++) {
        if (likeComments[i] == +commentId) {
          likeComments.splice(i, 1);
          await prisma.UserInfos.update({
            data: {
              likeComments,
            },
            where: {
              UserId: +UserId,
            },
          });
          break;
        }
      }
      // 2-A2. comment_likes -= 1
      const likeMinus = await prisma.commentLikes.update({
        data: {
          commentLikes: +currentLikes - 1,
        },
        where: {
          CommentId: +commentId,
        },
      });
      // 2-A3. 클라이언트에게 '좋아요 취소' 결과 반환
      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.COMMENTS.LIKE.LIKE_CANCEL,
        data: {
          PostId: +PostId,
          CommentId: +commentId,
          likes: likeMinus.commentLikes,
        },
      });
    } else {
      // <2-B 만약 없다면> '좋아요 추가' 하는 로직 실행
      // 2-B1. like_comments 배열에서 'comment_id' 요소 추가
      likeComments.push(+commentId);
      await prisma.UserInfos.update({
        data: {
          likeComments,
        },
        where: {
          UserId: +UserId,
        },
      });
      // 2-B2. comment_likes += 1
      const likePlus = await prisma.commentLikes.update({
        data: {
          commentLikes: +currentLikes + 1,
        },
        where: {
          CommentId: +commentId,
        },
      });
      // 2-B3. 클라이언트에게 '좋아요' 결과 반환
      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.COMMENTS.LIKE.LIKE,
        data: {
          PostId: +PostId,
          CommentId: +commentId,
          likes: likePlus.commentLikes,
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
