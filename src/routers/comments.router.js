import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { MESSAGES } from '../const/messages.const.js';
import { exceptRoles } from '../middlewares/role.middleware.js';
import { ROLE } from '../const/role.const.js';

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

    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.COMMENTS.CREATE.IS_NOT_EXIST,
      });
    }

    // 3. 작성한 내용을 바탕으로 comments 테이블에 comment 생성
    const newComment = await prisma.comments.create({
      //comment는 위에서 선언해서.. newComment로 선언함
      data: {
        PostId: +postId,
        UserId: +UserId,
        comment,
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
    const { UserId, Role } = req.user;

    const comment = await prisma.comments.findFirst({
      where: {
        commentId: +commentId,
      },
    });

    const role = await prisma.groups.findFirst({
      where: {
        groupName: ROLE.ADMIN,
      },
    });

    // 2. 글쓴이도 아니고 관리자도 아닐 경우
    if (comment.UserId !== UserId && Role !== role.groupId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.COMMENTS.DELETE.NOT_AVAILABLE,
      });
    }
    // 3. 댓글 삭제
    await prisma.comments.delete({
      where: {
        commentId: +commentId,
      },
    });

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

// 댓글 수정 -- 에러메시지 잘못돼서 바꿈..
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
router.get(
  '/me',
  authMiddleware,
  exceptRoles([ROLE.ADMIN]),
  async (req, res, next) => {
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
  }
);

/** 댓글 좋아요 API **/
router.patch('/like/:commentId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 필요한 정보들 가져오기
    // 1-1. 좋아요를 누른 사람이 누구인가? req.user에서 가져와!
    const { UserId } = req.user;
    // 1-2. 그리고 이 댓글의 id가 무엇인가? req.params에서 가져와!
    const { commentId } = req.params;
    // 1-3. 이 댓글이 뭔지 가져와봐
    const comment = await prisma.comments.findFirst({
      where: {
        commentId: +commentId,
      },
    });

    // 2. 이 API가 실행될 최소조건을 갖추었는지 검사
    // 2-1. 해당 댓글이 달린 게시글이 존재하는지 먼저 검사
    if (!comment.PostId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.COMMENTS.LIKE.NO_POST,
      });
    }
    const PostId = comment.PostId;
    // 2-2. 해당 댓글이 존재하는지 먼저 검사
    if (!commentId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.COMMENTS.LIKE.NO_COMMENTS,
      });
    }

    // 3. 내가 이미 좋아요를 눌렀는지 확인
    const checkLikeComment = await prisma.LikeComments.findFirst({
      where: {
        UserInfoId: +UserId,
        CommentId: +commentId,
      },
    });
    if (!checkLikeComment) {
      // 3-A1. 만약 없다면 좋아요 추가하는 로직 실행
      // 3-A2. 혹시 내가 쓴 댓글인지 확인
      const post = await prisma.Posts.findFirst({
        where: {
          postId: +PostId,
        },
      });
      // 만약 내가 쓴 댓글이면 "본인의 댓글에는 좋아요를 누를 수 없습니다."
      if (+UserId == +post.UserId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          message: MESSAGES.COMMENTS.LIKE.NOT_AVAILABLE,
        });
      }
      // like_comments 테이블에 데이터 생성!
      await prisma.LikeComments.create({
        data: {
          UserInfoId: +UserId,
          CommentId: +commentId,
        },
      });
      // 3-A3. 좋아요 추가 결과를 클라이언트에 반환
      // 3-A3-1. 일단 지금 좋아요 총 수를 계산
      const likePeople = await prisma.LikeComments.findMany({
        where: {
          CommentId: +commentId,
        },
      });
      const likes = likePeople.length;
      // 3-A3-2. 결과 총 정리해서 클라이언트에게 반환
      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.COMMENTS.LIKE.LIKE,
        data: {
          postId: +PostId,
          commentId: +commentId,
          likes: likes,
        },
      });
    } else {
      // 3-B1. 만약 있다면 좋아요 취소하는 로직 실행
      // like_comments 테이블에서 데이터 삭제!
      await prisma.LikeComments.delete({
        where: {
          likeCommentId: checkLikeComment.likeCommentId,
        },
      });
      // 3-B2. 좋아요 추가 결과를 클라이언트에 반환
      // 3-B2-1. 일단 지금 좋아요 총 수를 계산
      const likePeople = await prisma.LikeComments.findMany({
        where: {
          CommentId: +commentId,
        },
      });
      const likes = likePeople.length;
      // 3-B2-2. 결과 총 정리해서 클라이언트에게 반환
      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.COMMENTS.LIKE.LIKE_CANCEL,
        data: {
          postId: +PostId,
          commentId: +commentId,
          likes: likes,
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
