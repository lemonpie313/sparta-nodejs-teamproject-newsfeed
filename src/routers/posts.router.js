import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { MESSAGES } from '../const/messages.const.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { postValidator } from '../middlewares/joi/posts.joi.middleware.js';
import { GROUP } from '../const/group.const.js';


const router = express.Router();

//게시물 작성
router.post('/:group', authMiddleware, postValidator, async (req, res, next) => {
	try {
		const { postContent, postPicture, keywords } = req.body;
		const { group } = req.params;

		//이미지가 유효한지
		if (/(\.gif|\.jpg|\.jpeg)$/i.test(postPicture.value) == false) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				status: HTTP_STATUS.BAD_REQUEST,
				message: MESSAGES.POSTS.CREATE.POST_PICTURE.INVALID_FORMAT,
			});
		}

		//그룹 이름 검사
		if (!GROUP.includes(group)) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				status: HTTP_STATUS.NOT_FOUND,
				message: MESSAGES.POSTS.CREATE.GROUP.INVALID,
			});
		}

		const { UserId } = req.user;
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
		})


		// 3. 결과 반환한다.
		return res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: MESSAGES.POSTS.READ.SUCCEED,
			data: posts,
		})

	} catch (err) {
		next(err);
	}
});

router.get('/:group/:postId', authMiddleware, async (req, res, next) => { // posts/:group 와 posts/:postId 가 겹침.. 어쩔수없이 그룹도 같이 받게됨
	try{
		const { group, postId } = req.params;
		const { UserId } = req.user;
		const { postContent, postPicture, keywords } = req.body;
		
	} catch (err) {
		next(err);
	}
})


export default router;
