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
import { ROLE } from '../const/role.const.js';
import { Prisma } from '@prisma/client';
import { requireRoles, exceptRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

//게시물 작성 -- 관리자는 접근 권한 X, 리팩토링 완료(그룹 교차 X)
router.post(

	'/:group',
	authMiddleware,
	exceptRoles([ROLE.ADMIN]),
	postValidator,
	async (req, res, next) => {
		try {
			const { postContent, postPicture } = req.body;
			const { group } = req.params;
			const { UserId, role } = req.user;

			// 이미지가 유효한지 (jpg, png 등...)
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
			if (
				!Object.values(GROUP).includes(group) ||
				(role != ROLE.FAN && role != group)
			) {
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
						},
						select: {
							postId: true,
							postContent: true,
							createdAt: true,
							updatedAt: true,
							Comments: {
								select: {
									comment: true,
								},
							},
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

							_count: {
								select: {
									LikePosts: true,
								},
							},
						},
					});
					let pictures = [];
					if (postPicture) {
						for (let i = 0; i < postPicture.length; i++) {
							const picture = await tx.postPictures.create({
								data: {
									PostId: post.postId,
									picture: postPicture[i],
								},
							});
							pictures.push(picture);
						}
					}

					return { ...post, pictures };
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

// 내 게시물 목록 조회 -- 관리자는 접근 권한 X
router.get(
	'/me',
	authMiddleware,
	exceptRoles([ROLE.ADMIN]),
	async (req, res, next) => {
		try {
			// 1. 받아온 req.user에서 userId 가져온다.
			const { UserId } = req.user;

			// 2. 로그인한 사용자의 게시물 목록만 조회한다.
			const posts = await prisma.posts.findMany({
				where: {
					UserId,
				},
				select: {
					postId: true,
					UserId: true,
					User: {
						select: {
							UserInfos: {
								select: {
									nickname: true,
								},
							},
						},
					},
					PostPictures: {
						select: {
							picture: true,
						},
					},
					postContent: true,
					_count: {
						select: {
							LikePosts: true,
						},
					},
					createdAt: true,
					updatedAt: true,
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
	}
);

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
			//여기서부터
			const myPost = await prisma.$transaction(async (tx) => {
				const post = await tx.posts.update({
					data: {
						postContent,
					},
					where: {
						UserId,
						postId: +postId,
					},
					select: {
						postId: true,
						postContent: true,
						createdAt: true,
						updatedAt: true,
						Comments: {
							select: {
								comment: true,
							},
						},
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

						_count: {
							select: {
								LikePosts: true,
							},
						},
					},
				});
				let pictures = [];
				if (postPicture != undefined) {
					const deletedPicture = await tx.postPictures.deleteMany({
						where: {
							PostId: +postId,
						},
					});
					for (let i = 0; i < postPicture.length; i++) {
						const picture = await tx.postPictures.create({
							data: {
								PostId: post.postId,
								picture: postPicture[i],
							},
						});
						pictures.push(picture);
					}
				} else {
					pictures = await tx.postPictures.findMany({
						where: {
							PostId: +postId,
						},
					});
				}

				return { ...post, pictures };
			});
			//여기까지

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
router.get('/detail/:postId', authMiddleware, async (req, res, next) => {
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
				createdAt: true,
				updatedAt: true,
				PostPictures: {
					select: {
						picture: true,
						createdAt: true,
						updatedAt: true,
					},
				},
				Comments: {
					select: {
						comment: true,
					},
				},
				User: {
					select: {
						UserInfos: {
							select: {
								UserId: true,
								nickname: true,
								role: true,
							},
						},
					},
				},

				_count: {
					select: {
						LikePosts: true,
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

// 게시물 삭제
// if 내부는 관리자, else 내부는 일반 유저
router.delete('/:postId', authMiddleware, async (req, res, next) => {
	try {
		//유저 아이디를 req.user에서 가져옴
		const { UserId } = req.user;

		//포스트 아이디를 req.params에서 가져옴
		const { postId } = req.params;

		// 관리자 권한 삭제
		if (UserId === 1) {

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

			// 삭제
			await prisma.posts.delete({
				where: { postId: +postId },
			});

			return res.status(HTTP_STATUS.OK).json({
				status: HTTP_STATUS.OK,
				message: MESSAGES.POSTS.DELETE.SUCCEED,
				data: { postId: postId },
			});
		} else {
			// 관리자가 아닌 일반 유저의 삭제 API

			//해당 게시물이 존재 하는지 검사 params에서 가져온 id = post에서 가져온 id 일치인지 조회
			const post = await prisma.posts.findFirst({
				where: {
					UserId: +UserId,
					postId: +postId,
				},
			});

			// 
			if (!post) {
				return res.status(HTTP_STATUS.NOT_FOUND).json({
					status: HTTP_STATUS.NOT_FOUND,
					message: MESSAGES.POSTS.DELETE.NO_POSTID,
				});
			}

			// 삭제
			await prisma.posts.delete({
				where: { postId: +postId },
			});

			return res.status(HTTP_STATUS.OK).json({
				status: HTTP_STATUS.OK,
				message: MESSAGES.POSTS.DELETE.SUCCEED,
				data: { postId: postId },
			});
		}

	} catch (err) {
		next(err);
	}
});

// 게시물 좋아요 -- 관리자는 접근 권한 X
router.patch(
	'/like/:postId',
	authMiddleware,
	exceptRoles([ROLE.ADMIN]),
	async (req, res, next) => {
		try {
			const { postId } = req.params;
			const { UserId } = req.user;

			//게시물 찾기
			const likepost = await prisma.posts.findFirst({
				where: {
					postId: +postId,
				},
				select: {
					UserId: true,
					postId: true,
					postContent: true,
				},
			});

			if (!likepost) {
				return res.status(HTTP_STATUS.NOT_FOUND).json({
					status: HTTP_STATUS.NOT_FOUND,
					message: MESSAGES.POSTS.LIKES.IS_NOT_EXIST,
				});
			}
			if (likepost.UserId == UserId) {
				return res.status(HTTP_STATUS.FORBIDDEN).json({
					status: HTTP_STATUS.FORBIDDEN,
					message: MESSAGES.POSTS.LIKES.NOT_AVAILABLE,
				});
			}

			//좋아요 목록, 좋아요 개수
			const like = await prisma.likePosts.findMany({
				where: {
					PostId: +postId,
				},
			});
			let likes = like.length;

			//사용자가 누른 좋아요 데이터
			const myInfo = await prisma.userInfos.findFirst({
				where: {
					UserId,
				},
				select: {
					userInfoId: true,
				},
			});
			const likedIt = like.find((cur) => cur.UserInfoId == myInfo.userInfoId);

			if (likedIt) {
				await prisma.likePosts.delete({
					where: {
						likePostId: likedIt.likePostId,
					},
				});
				likes -= 1;
			} else {
				await prisma.likePosts.create({
					data: {
						UserInfoId: myInfo.userInfoId,
						PostId: +postId,
					},
				});
				likes += 1;
			}

			const post = await prisma.posts.findUnique({
				where: {
					postId: +postId,
				},
				select: {
					postId: true,
					postContent: true,
					createdAt: true,
					updatedAt: true,
					PostPictures: {
						select: {
							picture: true,
							createdAt: true,
							updatedAt: true,
						},
					},
					Comments: {
						select: {
							comment: true,
						},
					},
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

					_count: {
						select: {
							LikePosts: true,
						},
					},
				},
			});

			res.status(HTTP_STATUS.OK).json({
				status: HTTP_STATUS.OK,
				message: MESSAGES.POSTS.LIKES.SUCCEED,
				data: {
					post: { post },
				},
			});
		} catch (err) {
			next(err);
		}
	}
);

// 팬 게시물 최신순 조회 -- 리팩토링 완료
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
						role: ROLE.FAN,
					},
				},
			},
			select: {
				postId: true,
				PostPictures: {
					select: {
						picture: true,
						createdAt: true,
						updatedAt: true,
					},
				},
				group: true,
				postContent: true,
				createdAt: true,
				updatedAt: true,
				UserId: false,
				User: {
					select: {
						UserInfos: {
							select: {
								nickname: true,
							},
						},
					},
				},
				_count: {
					select: {
						LikePosts: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
		// 3. 조건에 맞는 게시물이 없을 경우에대한 오류 처리 반환
		if (!post) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				status: HTTP_STATUS.NOT_FOUND,
				message: MESSAGES.POSTS.READ.IS_NOT_EXIST,
			});
		}
		// 4. 조건에 맞는 게시물이 있을 경우에대한 성공 처리 반환
		return res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: MESSAGES.POSTS.READ.SUCCEED,
			data: post,
		});
	} catch (err) {
		next(err);
	}
});

// 아티스트 게시물 최신순 조회 -- 리팩토링 미완성 ( 좋아요 표시 미구현 )
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
						role: group,
					},
				},
			},
			select: {
				postId: true,
				group: true,
				postContent: true,
				createdAt: true,
				updatedAt: true,
				UserId: false,
				PostPictures: {
					select: {
						picture: true,
						createdAt: true,
						updatedAt: true,
					},
				},
				User: {
					select: {
						UserInfos: {
							select: {
								nickname: true,
								role: true,
							},
						},
					},
				},
				_count: {
					select: {
						LikePosts: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
		// 3. 조건에 맞는 게시물이 없을 경우에대한 오류 처리 반환
		if (!post) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				status: HTTP_STATUS.NOT_FOUND,
				message: MESSAGES.POSTS.READ.IS_NOT_EXIST,
			});
		}

		// 4. 조건에 맞는 게시물이 있을 경우에대한 성공 처리 반환
		return res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: MESSAGES.POSTS.READ.SUCCEED,
			data: post,
		});
	} catch (err) {
		next(err);
	}
});

// 팔로우한 게시물 피드 - 구현 완료
router.get(
	'/following',
	authMiddleware,
	exceptRoles([ROLE.ADMIN]),
	async (req, res, get) => {
		const { UserId } = req.user;

		const follow = await prisma.followers.findMany({
			where: {
				FollowerUserId: UserId,
			},
			select: {
				Followings: {
					select: {
						FollowingUserId: true,
					},
				},
			},
		});
		const followId = follow.map((cur) => cur.Followings.FollowingUserId);

		const followPosts = await prisma.posts.findMany({
			where: {
				UserId: {
					in: followId,
				},
			},
			select: {
				postId: true,
				PostPictures: {
					select: {
						picture: true,
						createdAt: true,
						updatedAt: true,
					},
				},
				group: true,
				postContent: true,
				createdAt: true,
				updatedAt: true,
				UserId: false,
				User: {
					select: {
						UserInfos: {
							select: {
								nickname: true,
							},
						},
					},
				},
				_count: {
					select: {
						LikePosts: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		console.log(followId);
		return res.status(HTTP_STATUS.OK).json({
			status: HTTP_STATUS.OK,
			message: 'goooood',
			data: followPosts,
		});
	}
);

export default router;
