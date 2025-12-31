import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './post.entity';

type UpdatePostDto = Omit<CreatePostDto, 'latitude' | 'longitude' | 'address'>;

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async getPosts(page: number) {
    const perPage = 10;
    const offSet = (page - 1) * perPage;

    return this.postRepository
      .createQueryBuilder('post')
      .orderBy('post.date', 'DESC')
      .take(perPage)
      .skip(offSet)
      .getMany();
  }

  async getPostById(id: number) {
    try {
      const foundPost = await this.postRepository
        .createQueryBuilder('post')
        .where('post.id = :id', { id })
        .getOne();

      if (!foundPost) {
        throw new NotFoundException('존재하지 않는 피드입니다.');
      }

      return foundPost;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '피드를 가져오는 도중 에러가 발생했습니다.',
      );
    }
  }

  async createPost(createPostDto: CreatePostDto) {
    const {
      latitude,
      longitude,
      color,
      address,
      title,
      description,
      date,
      score,
      imageUris,
    } = createPostDto;

    const post = this.postRepository.create({
      latitude,
      longitude,
      color,
      address,
      title,
      description,
      date,
      score,
    });

    try {
      await this.postRepository.save(post);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '장소를 추가하는 도중 에러가 발생했습니다.',
      );
    }

    return post;
  }

  async deletePost(id: number) {
    try {
      const result = await this.postRepository
        .createQueryBuilder('post')
        .delete()
        .from(Post)
        .where('id = :id', { id })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException('삭제하려는 장소가 존재하지 않습니다.');
      }

      return id;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '장소를 삭제하는 도중 에러가 발생했습니다.',
      );
    }
  }

  async updatePost(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.getPostById(id);
    const { title, description, color, date, score, imageUris } = updatePostDto;

    post.title = title;
    post.description = description;
    post.color = color;
    post.date = date;
    post.score = score;

    // image module

    try {
      await this.postRepository.save(post);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '피드를 수정하는 도중 에러가 발생했습니다.',
      );
    }

    return post;
  }
}
