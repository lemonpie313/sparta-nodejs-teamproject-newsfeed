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
      },
      //name, nickname, selfIntroduction
      NICKNAME: {
        REQUIRED: '닉네임을 입력해주세요.',
      },
      SELF_INTRODUCTION: {
        REQUIRED: '한줄소개를 입력해주세요.',
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
    READ: {
      SUCCEED: '회원정보 조회에 성공하였습니다.',
    },
    LOGOUT: {
      SUCCEED: '로그아웃 되었습니다.',
    },
  },
  POSTS: {
    //알아서 추가해주세요!!
  },
};
