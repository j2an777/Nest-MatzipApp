import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/auth/user.entity';

import { Favorite } from './favorite.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async getMyFavoritePosts(page: number, user: User) {
    const perPage = 10;
    const offSet = (page - 1) * perPage;

    // favorite과 post에서 겹치는 것을 가져오기 위해 innerjoin 이후에 해당 이미지에서는 leftJoin해서 post기준으로 image 가져오도록 로직
    const favorites = await this.favoriteRepository
      .createQueryBuilder('favorite')
      .innerJoinAndSelect('favorite.post', 'post')
      .leftJoinAndSelect('post.images', 'image')
      .where('favorite.userId = :userId', { userId: user.id })
      .orderBy('post.date', 'DESC')
      .skip(offSet)
      .take(perPage)
      .getMany();

    const newPosts = favorites.map((favorite) => {
      const post = favorite.post;
      const images = [...post.images].sort((a, b) => a.id - b.id);
      return { ...post, images };
    });

    return newPosts;
  }

  async toggleFavorite(postId: number, user: User) {
    if (!postId) throw new BadRequestException('존재하지 않는 피드입니다.');

    const existingFavorite = await this.favoriteRepository.findOne({
      where: { postId, userId: user.id },
    });

    // 이미 즐겨찾기 되어있다면 해제하도록 삭제 및 해당 postId 리턴
    if (existingFavorite) {
      await this.favoriteRepository.delete(existingFavorite.id);

      return existingFavorite.postId;
    }

    // 안되어있다면 해당 레포지토리에 생성
    const favorite = this.favoriteRepository.create({
      postId,
      userId: user.id,
    });

    await this.favoriteRepository.save(favorite);

    return favorite.postId;
  }
}
