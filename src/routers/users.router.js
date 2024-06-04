import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/access-token.middleware.js';
import { HTTP_STATUS } from '../const/http-status.const.js';
import { MESSAGES } from '../const/messages.const.js';
import { userInfoUpdateValidator } from '../middlewares/joi/users.joi.middleware.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// 회원정보 조회 - 리팩토링 완료
router.get('/', authMiddleware, async (req, res, next) => {
	try {
		const { UserId } = req.user;
		const user = await prisma.Users.findFirst({
			where: {
				userId: UserId,
			},
			select: {
				userId: true,
				email: true,
				UserInfos: {
					select: {
						name: true,
						nickname: true,
						selfIntroduction: true,
						profilePicture: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
		});

		return res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: MESSAGES.USERS.READ.SUCCEED,
			data: { user },
		});
	} catch (err) {
		next(err);
	}
});

// 내 정보 수정 API
router.patch(
	'/',
	authMiddleware,
	userInfoUpdateValidator,
	async (req, res, next) => {
		try {
			const { UserId } = req.user;
			const { name, nickname, selfIntroduction, profilePicture, password } =
				req.body;

			const user = await prisma.Users.findFirst({
				where: {
					userId: UserId,
				},
				select: {
					userId: true,
					password: true,
				},
			});
			if (!user) {
				return res.status(HTTP_STATUS.NOT_FOUND).json({
					status: HTTP_STATUS.NOT_FOUND,
					message: MESSAGES.USERS.UPDATE.IS_NOT_EXIST,
				});
			}
			console.log(await bcrypt.compare(password, user.password));
			console.log(user.password);
			if (!(await bcrypt.compare(password, user.password))) {
				return res.status(HTTP_STATUS.BAD_REQUEST).json({
					status: HTTP_STATUS.BAD_REQUEST,
					message: MESSAGES.USERS.UPDATE.PW_NOT_MATCHED,
				});
			}

			const myInfo = await prisma.userInfos.update({
				data: {
					name,
					nickname,
					selfIntroduction,
					profilePicture,
				},
				where: {
					UserId: user.userId,
				},
				select: {
					name: true,
					nickname: true,
					selfIntroduction: true,
					profilePicture: true,
					updatedAt: true,
				},
			});

			return res.status(HTTP_STATUS.OK).json({
				status: HTTP_STATUS.OK,
				message: MESSAGES.USERS.UPDATE.SUCCEED,
				data: { myInfo },
			});
		} catch (err) {
			next(err);
		}
	}
);
// 다른 사람 프로필 조회
router.get('/:userInfoId', authMiddleware, async (req, res, next) => {
	// 1. userInfoId 받아오기
	const { userInfoId } = req.params;
	console.log(userInfoId);

	// 2. 테이블에서 해당 조건 값 가져오기
	const profile = await prisma.userInfos.findUnique({
		where: {
			userInfoId: +userInfoId
		},
		select: {
			userInfoId: true,
			role: true,
			nickname: true,
			selfIntroduction: true,
			profilePicture: true,
			createdAt: true,
			updatedAt: true,
			User: {
				select: {
					Posts: {
						select: {
							postId: true,
							postContent: true,
							group: true
						}
					}
				}
			}
		}
	});

	// 3. 오류 처리 반환
	if (!profile) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({
			status: HTTP_STATUS.NOT_FOUND,
			message: MESSAGES.USERS.READ.IS_NOT_EXIST
		});
	}
	// 4. 성공 처리 반환
	return res.status(HTTP_STATUS.OK).json({
		status: HTTP_STATUS.OK,
		message: MESSAGES.USERS.READ.SUCCEED,
		data: profile
	});
});
export default router;
