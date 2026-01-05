import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

import { getUniqueFileName } from '@/@common/utils';
import numbers from '@/@common/constants';

// uploads 폴더에서 읽고 만드는 함수
// try {
//   fs.readdirSync('uploads');
// } catch (error) {
//   fs.mkdirSync('uploads');
// }

@Controller('images')
@UseGuards(AuthGuard())
export class ImageController {
  @UseInterceptors(
    FilesInterceptor('images', numbers.MAX_IMAGE_COUNT, {
      // 기존 스토리지로 filename을 만들고, 해당 목적지를 uploads 폴더 하위로 지정하는 로직
      // storage: diskStorage({
      //   destination(req, file, cb) {
      //     cb(null, 'uploads/');
      //   },
      //   filename(req, file, cb) {
      //     const ext = extname(file.originalname);
      //     cb(null, basename(file.originalname, ext) + Date.now() + ext);
      //   },
      // }),
      limits: { fileSize: numbers.MAX_IMAGE_SIZE }, //20MB
    }),
  )
  @Post('/')
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    // AWS S3 Client 설정
    const s3Client = new S3Client({
      region: process.env.AWS_BUCKET_REGION as string,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      },
    });

    const uuid = Date.now();

    // 업로드를 위한 파일이름과 s3 client에 전달할 command 구성(버킷, 파일 저장소 위치, 파일) 후 s3client send 호출
    const uploadPromises = files.map((file) => {
      const fileName = getUniqueFileName(file, uuid);
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: `original/${fileName}`,
        Body: file.buffer,
      };

      const command = new PutObjectCommand(uploadParams);

      return s3Client.send(command);
    });

    // uploadPromises 비동기 요청으로 요청 들어온 파일은 s3 저장소에 들어가게 된다.
    await Promise.all(uploadPromises);

    const uris = files.map((file) => {
      const fileName = getUniqueFileName(file, uuid);

      return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/original${fileName}`;
    });

    return uris;
  }
  // 기존 스토리지에 저장하는 uploadImages
  // uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
  //   const uris = files.map((file) => file.filename);

  //   return uris;
  // }
}
