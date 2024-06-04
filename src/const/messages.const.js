export const MESSAGES = {
	AUTH: {
		COMMON: {
			EMAIL: {
				REQUIRED: '이메일을 입력해주세요.',
				INVALID_FORMAT: '이메일 형식이 올바르지 않습니다.',
				DUPLICATED: '이미 가입된 사용자입니다.',
			},
			PASSWORD: {
				REQUIRED: '비밀번호를 입력해주세요.',
				MIN_LENGTH: '비밀번호는 6자리 이상이어야 합니다.',
			},
			NAME: {
				REQUIRED: '이름을 입력해주세요.',
				EMPTY: '이름은 비워둘 수 없습니다',
			},
			//name, nickname, selfIntroduction
			NICKNAME: {
				REQUIRED: '닉네임을 입력해주세요.',
				EMPTY: '닉네임은 비워둘 수 없습니다',
			},
			SELF_INTRODUCTION: {
				REQUIRED: '한줄소개를 입력해주세요.',
				EMPTY: '한줄소개는 비워둘 수 없습니다',
			},
		},
		SIGN_UP: {
			IS_EXIST: '이미 가입된 사용자입니다.',
			SUCCEED: '회원가입에 성공했습니다.',
		},
		SIGN_IN: {
			IS_NOT_EXIST: '회원 정보를 찾을 수 없습니다.',
			PW_NOT_MATCHED: '비밀번호가 일치하지 않습니다.',
			SUCCEED: '로그인 되었습니다.',
		},
		LOGOUT: {
			IS_NOT_EXIST: '회원 정보를 찾을 수 없습니다.',
			SUCCEED: '로그아웃 되었습니다.',
		},
		TOKEN: {
			SUCCEED: '토큰 재발급에 성공했습니다.',
		},
	},
	USERS: {
		READ: {
			SUCCEED: '회원정보 조회에 성공하였습니다.',
			IS_NOT_EXIST: '잘못된 회원 번호입니다.'
		},
		UPDATE: {
			NAME: {
				EMPTY: '이름은 1글자 이상 입력해야 합니다.',
			},
			NICKNAME: {
				EMPTY: '닉네임은 1글자 이상 입력해야 합니다.',
			},
			SELF_INTRODUCTION: {
				EMPTY: '자기소개는 1글자 이상 입력해야 합니다.',
			},
			IS_NOT_EXIST: '회원 정보를 찾을 수 없습니다.',
			PW_NOT_MATCHED: '비밀번호가 일치하지 않습니다.',
			SUCCEED: '회원정보 수정이 완료되었습니다.',
		},
	},
	POSTS: {
		CREATE: {
			POST_CONTENT: {
				REQUIRED: '게시글 내용을 입력해 주세요.',
			},
			POST_PICTURE: {
				INVALID_FORMAT: '지원하지 않는 파일 형식입니다.',
			},
			KEYWORDS: {
				MAX_LENGTH: '키워드는 10글자 이내로만 작성 가능합니다.',
			},
			GROUP: {
				INVALID: '잘못된 경로입니다.',
			},
			SUCCEED: '게시물 작성이 완료되었습니다.',
		},
		READ: {
			SUCCEED: '게시물 조회가 완료되었습니다.',
			IS_NOT_EXIST: '게시물이 존재하지 않습니다.',
		},
		UPDATE: {
			SUCCEED: '게시물 수정이 완료되었습니다.',
		},
		DELETE: {
			NO_POSTID: '해당 게시글이 존재하지 않습니다.',
			POST_ID_NOT_MATCHED: '작성자가 다른 게시물입니다.',
			SUCCEED: '삭제가 완료되었습니다.',
		},
		LIKES: {
			IS_NOT_EXIST: '해당 게시글이 존재하지 않습니다',
			NOT_AVAILABLE: '본인의 게시물에는 좋아요를 누를 수 없습니다.',
			SUCCEED: '좋아요가 반영되었습니다.',
		},
	},
	COMMENTS: {
		CREATE: {
			NO_COMMENTS: '댓글을 입력해 주세요.',
			SUCCEED: '댓글 작성에 성공하였습니다.',
		},
		READ: {
			SUCCEED: '댓글 조회에 성공하였습니다.',
		},
		UPDATE: {
			NO_COMMENTS: '댓글을 입력해 주세요.',
			NO_AUTHORIZATION: '내가 쓴 댓글이 아닙니다.',
			NO_EDIT: '수정될 내용이 없습니다.',
			SUCCEED: '댓글 수정에 성공하였습니다.',
		},
		DELETE: {
			NO_COMMENTS: '댓글이 존재하지 않습니다.',
			NO_AUTHORIZATION: '내가 쓴 댓글이 아닙니다.',
			SUCCEED: '댓글 삭제에 성공하였습니다.',
		},
		LIKE: {
			LIKE: '좋아요가 반영되었습니다.',
			LIKE_CANCEL: '좋아요 취소가 반영되었습니다.',
			NO_POST: '해당 게시글이 존재하지 않습니다.',
			NO_COMMENTS: '해당 댓글이 존재하지 않습니다.',
		},
	},
	JWT: {
		NONE: '인증 정보가 없습니다.',
		NOT_TYPE: '지원하지 않는 인증방식입니다.',
		NO_MATCH: '인증 정보와 일치하는 사용자가 없습니다.',
		EXPIRED: '인증 정보가 만료되었습니다.',
		NOT_AVAILABLE: '인증 정보가 유효하지 않습니다.',
		ELSE: '비정상적인 접근입니다.',
		AGAIM_TOKEN: '토큰 재발급에 성공했습니다',
		DISCARDED_TOKEN: '폐기된 인증정보입니다.',
	},
	AUTH: {
		COMMON: {
			EMAIL: {
				REQUIRED: '이메일을 입력해주세요.',
				INVALID_FORMAT: '이메일 형식이 올바르지 않습니다.',
				DUPLICATED: '이미 가입된 사용자입니다.',
			},
			PASSWORD: {
				REQUIRED: '비밀번호를 입력해주세요.',
				MIN_LENGTH: '비밀번호는 6자리 이상이어야 합니다.',
			},
			NAME: {
				REQUIRED: '이름을 입력해주세요.',
				EMPTY: '이름은 비워둘 수 없습니다',
			},
			//name, nickname, selfIntroduction
			NICKNAME: {
				REQUIRED: '닉네임을 입력해주세요.',
				EMPTY: '닉네임은 비워둘 수 없습니다',
			},
			SELF_INTRODUCTION: {
				REQUIRED: '한줄소개를 입력해주세요.',
				EMPTY: '한줄소개는 비워둘 수 없습니다',
			},
		},
		SIGN_UP: {
			IS_EXIST: '이미 가입된 사용자입니다.',
			SUCCEED: '회원가입에 성공했습니다.',
		},
		SIGN_UP_ARTIST: {
			NOT_AVAILABLE: '회원가입을 할 수 없습니다.',
		},
		SIGN_IN: {
			IS_NOT_EXIST: '회원 정보를 찾을 수 없습니다.',
			PW_NOT_MATCHED: '비밀번호가 일치하지 않습니다.',
			SUCCEED: '로그인 되었습니다.',
		},
		LOGOUT: {
			IS_NOT_EXIST: '회원 정보를 찾을 수 없습니다.',
			SUCCEED: '로그아웃 되었습니다.',
		},
		TOKEN: {
			SUCCEED: '토큰 재발급에 성공했습니다.',
		},
	},
	USERS: {
		READ: {
			SUCCEED: '회원정보 조회에 성공하였습니다.',
		},
		UPDATE: {
			NAME: {
				EMPTY: '이름은 1글자 이상 입력해야 합니다.',
			},
			NICKNAME: {
				EMPTY: '닉네임은 1글자 이상 입력해야 합니다.',
			},
			SELF_INTRODUCTION: {
				EMPTY: '자기소개는 1글자 이상 입력해야 합니다.',
			},
			IS_NOT_EXIST: '회원 정보를 찾을 수 없습니다.',
			PW_NOT_MATCHED: '비밀번호가 일치하지 않습니다.',
			SUCCEED: '회원정보 수정이 완료되었습니다.',
		},
	},
	POSTS: {
		CREATE: {
			POST_CONTENT: {
				REQUIRED: '게시글 내용을 입력해 주세요.',
			},
			POST_PICTURE: {
				INVALID_FORMAT: '지원하지 않는 파일 형식입니다.',
			},
			KEYWORDS: {
				MAX_LENGTH: '키워드는 10글자 이내로만 작성 가능합니다.',
			},
			GROUP: {
				INVALID: '잘못된 경로입니다.',
			},
			SUCCEED: '게시물 작성이 완료되었습니다.',
		},
		READ: {
			SUCCEED: '게시물 조회가 완료되었습니다.',
			IS_NOT_EXIST: '게시물이 존재하지 않습니다.',
		},
		UPDATE: {
			SUCCEED: '게시물 수정이 완료되었습니다.',
		},
		DELETE: {
			NO_POSTID: '해당 게시글이 존재하지 않습니다.',
			POST_ID_NOT_MATCHED: '작성자가 다른 게시물입니다.',
			SUCCEED: '삭제가 완료되었습니다.',
		},
		LIKES: {
			IS_NOT_EXIST: '해당 게시글이 존재하지 않습니다',
			NOT_AVAILABLE: '본인의 게시물에는 좋아요를 누를 수 없습니다.',
			SUCCEED: '좋아요가 반영되었습니다.',
		},
	},
	COMMENTS: {
		CREATE: {
			NO_COMMENTS: '댓글을 입력해 주세요.',
			SUCCEED: '댓글 작성에 성공하였습니다.',
		},
		READ: {
			SUCCEED: '댓글 조회에 성공하였습니다.',
		},
		UPDATE: {
			NO_COMMENTS: '댓글을 입력해 주세요.',
			NO_AUTHORIZATION: '내가 쓴 댓글이 아닙니다.',
			NO_EDIT: '수정될 내용이 없습니다.',
			SUCCEED: '댓글 수정에 성공하였습니다.',
		},
		DELETE: {
			NO_COMMENTS: '댓글이 존재하지 않습니다.',
			NO_AUTHORIZATION: '내가 쓴 댓글이 아닙니다.',
			SUCCEED: '댓글 삭제에 성공하였습니다.',
		},
		LIKE: {
			LIKE: '좋아요가 반영되었습니다.',
			LIKE_CANCEL: '좋아요 취소가 반영되었습니다.',
			NO_POST: '해당 게시글이 존재하지 않습니다.',
			NO_COMMENTS: '해당 댓글이 존재하지 않습니다.',
		},
	},
	JWT: {
		NONE: '인증 정보가 없습니다.',
		NOT_TYPE: '지원하지 않는 인증방식입니다.',
		NO_MATCH: '인증 정보와 일치하는 사용자가 없습니다.',
		EXPIRED: '인증 정보가 만료되었습니다.',
		NOT_AVAILABLE: '인증 정보가 유효하지 않습니다.',
		ELSE: '비정상적인 접근입니다.',
		AGAIM_TOKEN: '토큰 재발급에 성공했습니다',
		DISCARDED_TOKEN: '폐기된 인증정보입니다.',
	},
};
