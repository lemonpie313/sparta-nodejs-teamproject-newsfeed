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
import { Prisma } from '@prisma/client';

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


			const post = await prisma.$transaction(
				async (tx) => {
					const post = await tx.posts.create({
						data: {
							group,
							UserId: +UserId,
							postContent,
							postPicture: postPicture ?? [],
							keywords: keywords ?? [],
						},
					});

					const postLikes = await tx.postLikes.create({
						data: {
							PostId: post.postId,
							postLikes: 0,
						},
						select: {
							postLikesId: true,
							postLikes: true,
						},
					});
					return { ...post, ...postLikes };
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
				}
			);

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

// 게시물 수정
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
								UserId: true,
							},
						},
					},
				},
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
		// 4.
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

/* 게시물 좋아요 */
//userInfo의 likePosts에 이미 해당 게시물이 있다
// -> 좋아요 취소, likePosts에서 postId 삭제, prefer 키워드 카운트 다운
// 해당 게시물이 없다
// -> 좋아요 반영, likePosts에 postId 추가, prefer 키워드 카운트 업
router.patch('/like/:postId', authMiddleware, async (req, res, next) => {
	try {
		const { postId } = req.params;
		const { UserId } = req.user;

		//게시물 찾기
		const post = await prisma.posts.findFirst({
			where: {
				postId: +postId,
			},
			select: {
				postId: true,
				postContent: true,
				keywords: true,
				PostLikes: {
					select: {
						postLikesId: true,
						postLikes: true,
					},
				},
			},
		});

		if (!post) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				status: HTTP_STATUS.NOT_FOUND,
				message: MESSAGES.POSTS.LIKES.IS_NOT_EXIST,
			});
		}

		//내정보 > 좋아요 여부
		const userInfo = await prisma.userInfos.findFirst({
			where: {
				UserId,
			},
			select: {
				UserId: true,
				prefer: true,
				likePosts: true,
			},
		});

		//좋아요 수 수정 / userInfo 내용 수정
		//근데 좋아요 취소할때 userInfo에서 prefer, likePosts 삭제는 데이터가 길면 오래걸릴텐데.......
		const keywords = post.keywords;
		let updatedLikes = post.PostLikes.postLikes;
		let userLikes = userInfo.likePosts;
		let userPrefer = userInfo.prefer;
		if (userInfo.likePosts.includes(post.postId)) {
			updatedLikes -= 1;
			userLikes = userLikes.filter((cur) => {
				cur != post.postId;
			});
			keywords.forEach((key) => {
				if (userPrefer[`${key}`] <= 1) {
					delete userPrefer[`${key}`];
				} else {
					userPrefer[`${key}`] -= 1;
				}
			});
		} else {
			updatedLikes += 1;
			userLikes.push(+postId);
			keywords.forEach((key) => {
				if (
					!Object.keys(userPrefer).includes(`${key}`) ||
					userPrefer[key] == 0
				) {
					userPrefer[key] = 1;
				} else {
					userPrefer[key] += 1;
				}
			});
		}

		//좋아요 반영
		const postLikesUpdated = await prisma.postLikes.update({
			data: {
				postLikes: updatedLikes,
			},
			where: {
				PostId: post.postId,
			},
		});

		//userInfo 반영
		const userInfoUpdate = await prisma.userInfos.update({
			data: {
				prefer: userPrefer,
				likePosts: userLikes,
			},
			where: {
				UserId,
			},
		});

		res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: MESSAGES.POSTS.LIKES.SUCCEED,
			data: { postLikesUpdated },
		});
	} catch (err) {
		next(err);
	}
});

// 팬 게시물 최신순 조회
router.get('/recent/:group', authMiddleware, async (req, res, next) => {
	try {
		// 1. 어떤 그룹인지 값 가져오기
		const { group } = req.params;

		// 2. 해당 그룹, 작성자의 role이 FAN인 것만 조건으로 걸고 최신순(내림차순) 조회하기
		const post = await prisma.posts.findMany({
			where: {
				group,
				User: {
					UserInfos: {
						role: 'FAN'
					}
				}
			},
			select: {
				postId: true,
				group: true,
				postContent: true,
				postPicture: true,
				keywords: true,
				createdAt: true,
				updatedAt: true,
				UserId: false,
				User: {
					select: {
						UserInfos: {
							select: {
								nickname: true
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
		});
		// 3. 조건에 맞는 게시물이 없을 경우에대한 오류 처리 반환
		if (!post) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				status: HTTP_STATUS.NOT_FOUND,
				message: MESSAGES.POSTS.READ.IS_NOT_EXIST
			});
		}
		// 4. 조건에 맞는 게시물이 있을 경우에대한 성공 처리 반환
		return res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: MESSAGES.POSTS.READ.SUCCEED,
			data: post
		});

	} catch (err) {
		next(err);
	}
});

// 아티스트 게시물 최신순 조회
router.get('/artists/:group', authMiddleware, async (req, res, next) => {
	try {
		// 1. 어떤 그룹인지 값 가져오기
		const { group } = req.params;

		// 2. 해당 그룹, 작성자의 role이 FAN인 것만 조건으로 걸고 최신순(내림차순) 조회하기
		const post = await prisma.posts.findMany({
			where: {
				group,
				User: {
					UserInfos: {
						role: 'ARTIST'
					}
				}
			},
			select: {
				postId: true,
				group: true,
				postContent: true,
				postPicture: true,
				keywords: true,
				createdAt: true,
				updatedAt: true,
				UserId: false,
				User: {
					select: {
						UserInfos: {
							select: {
								nickname: true,
								role: true,
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
		});
		// 3. 조건에 맞는 게시물이 없을 경우에대한 오류 처리 반환
		if (!post) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				status: HTTP_STATUS.NOT_FOUND,
				message: MESSAGES.POSTS.READ.IS_NOT_EXIST
			});
		}

		// 4. 조건에 맞는 게시물이 있을 경우에대한 성공 처리 반환
		return res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: MESSAGES.POSTS.READ.SUCCEED,
			data: post
		});

	} catch (err) {
		next(err);
	}
});

export default router;
