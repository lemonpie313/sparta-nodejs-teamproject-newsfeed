import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import dotEnv from 'dotenv';

dotEnv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});

// 확장자 검사 목록 // file.mimetype ==="image/png" 이런 식으로도 씀
const allowedExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.bmp',
  '.gif',
  '.tiff',
  '.mp4',
  '.mov',
  '.wmv',
  '.avi',
  '.avchd',
  '.mkv',
  '.mpeg',
  '.flv',
  '.f4v',
  '.swf',
];

// 로컬에 저장
const toLocal = multer({
  // 파일 저장 위치 (disk , memory 선택)
  storage: multer.diskStorage({
    destination: function (req, file, done) {
      done(null, 'test/'); // null은 문제가 생겼을 때, 그게 아니라면 "uploads/"
    },
    filename: function (req, file, done) {
      // 그룹명 가져오기
      const { group: group } = req.params;
      // 임의번호 생성
      let randomNumber = '';
      for (let i = 0; i < 8; i++) {
        randomNumber += String(Math.floor(Math.random() * 10));
      }
      const ext = path.extname(file.originalname);
      done(null, group + '_' + Date.now() + '_' + randomNumber + ext);
    },
  }),
  // 파일 허용 사이즈 (5 MB)는 왜 이정도로 했는지 발표 때 설명 가능하도록 할 것
  limits: { fileSize: 5 * 1024 * 1024 },
});

// s3에 저장
const toS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, callback) => {
      // 그룹 명 받아오기
      const { group: group } = req.params;

      // 오늘 날짜 구하기
      const today = new Date();
      const todayNum = Number(today);

      // 임의번호 생성
      let randomNumber = '';
      for (let i = 0; i < 8; i++) {
        randomNumber += String(Math.floor(Math.random() * 10));
      }

      // 확장자 검사
      const extension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        return callback(new Error('확장자 에러'));
      }

      // test라는 파일 내부에 업로드한 사용자에 따라 임의의 파일명으로 저장
      callback(null, `test/${group}_${todayNum}_${randomNumber}` + extension);
    },
    // acl 권한 설정
    acl: 'public-read-write',
  }),
  // 이미지 용량 제한 (6MB)
  limits: {
    fileSize: 6 * 1024 * 1024,
  },
});

export { toLocal, toS3 };
