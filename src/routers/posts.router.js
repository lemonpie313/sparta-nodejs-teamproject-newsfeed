import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';

const router = express.Router();

//게시물 작성
router.post('/:group', authMiddleware, async (req, res, next) => {
	try {
		// 1. 필요한 정보 가져오기
		// 1-1. request body로부터 postContent, postPicture, keywords 받아온다.
		const { postContent, postPicture, keywords } = req.body;
		// 1-2. group 가져오기
		const { group } = req.params;

		// 2. 만약에 셋 중 하나라도 없으면 에러 처리
		if (!postContent) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				status: HTTP_STATUS.BAD_REQUEST,
				message: MESSAGES.POSTS.CREATE.NO_POSTCONTENT,
			});
		}
		if (!postPicture) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				status: HTTP_STATUS.BAD_REQUEST,
				message: MESSAGES.POSTS.CREATE.NO_POSTPICTURE,
			});
		}
		if (!keywords) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				status: HTTP_STATUS.BAD_REQUEST,
				message: MESSAGES.POSTS.CREATE.NO_KEYWORDS,
			});
		}

		// 3. 작성자 유저 ID를 req.user로 받아오고,
		const { UserId } = req.user;
		// 4. 작성한 내용을 바탕으로 posts 테이블에 생성
		const post = await prisma.posts.create({
			data: {
				group,
				UserId: +UserId,
				postContent,
				postPicture,
				keywords,
			}
		});
		// 5. 생성 결과를 클라이언트에 반환
		// 5-1. post_id, User_id, nickname, post_content, post_picture, keywords

		return res.status(HTTP_STATUS.CREATED).json({
			status: HTTP_STATUS.CREATED,
			message: MESSAGES.POSTS.CREATE.SUCCEED,
			data: post,
		})
	} catch (err) {
		next(err);
	}
});

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
				createdAt: "desc"
			}
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
		});

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
});

export default router;
