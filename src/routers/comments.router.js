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
		const { UserId } = req.user;
		// 2. 해당 댓글이 존재하는지 확인
		const comment = await prisma.comments.findFirst({
			where: {
				UserId: +UserId,
			},
		});

		// 4. 댓글 작성 결과를 클라이언트에 반환
		return res.status(HTTP_STATUS.CREATED).json({});
	} catch (err) {
		next(err);
	}
});

export default router;