import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GetUser } from '@/@common/decorators/get-user.decorator';
import { User } from '@/auth/user.entity';

import { FavoriteService } from './favorite.service';

@Controller('favorites')
@UseGuards(AuthGuard())
export class FavoriteController {
  constructor(private favoriteService: FavoriteService) {}

  @Get('/my')
  async getMyFavoritePosts(@Query('page') page: number, @GetUser() user: User) {
    return this.favoriteService.getMyFavoritePosts(page, user);
  }

  @Post('/:id')
  toggleFavorite(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.favoriteService.toggleFavorite(id, user);
  }
}
