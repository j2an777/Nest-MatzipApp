import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { Image } from '@/image/image.entity';

import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Image]), AuthModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
