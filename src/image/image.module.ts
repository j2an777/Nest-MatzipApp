import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';

import { ImageController } from './image.controller';
import { Image } from './image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Image]), AuthModule],
  controllers: [ImageController],
})
export class ImageModule {}
