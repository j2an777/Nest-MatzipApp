import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MarkerColor } from '@/post/marker-color.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { EditProfileDto } from './dto/editProfile.dto';
import { AuthDto } from './dto/auth.dto';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private ConfigService: ConfigService,
  ) {}

  async signup(authDto: AuthDto) {
    const { email, password } = authDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      loginType: 'email',
    });

    try {
      await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }

      throw new InternalServerErrorException(
        '회원가입 도중 에러가 발생했습니다.',
      );
    }
  }

  private async getTokens({ email }: { email: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { email },
        {
          secret: this.ConfigService.get('JWT_SECRET'),
          expiresIn: this.ConfigService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        { email },
        {
          secret: this.ConfigService.get('JWT_SECRET'),
          expiresIn: this.ConfigService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async signin(authDto: AuthDto) {
    const { email, password } = authDto;
    const user = await this.userRepository.findOneBy({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const { accessToken, refreshToken } = await this.getTokens({ email });
    await this.updateHashedRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  private async updateHashedRefreshToken(id: number, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    try {
      await this.userRepository.update(id, { hashedRefreshToken });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getNewToken(user: User) {
    const { id, email } = user;
    const { refreshToken } = await this.getTokens({ email });

    if (!user.hashedRefreshToken) {
      throw new ForbiddenException();
    }

    await this.updateHashedRefreshToken(id, refreshToken);
  }

  async getProfile(user: User) {
    const { password, hashedRefreshToken, ...restUser } = user;

    return restUser;
  }

  async editProfile(editProfileDto: EditProfileDto, user: User) {
    const profile = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!profile) throw new NotFoundException('존재하지 않는 사용자입니다.');

    const { nickname, imageUri } = editProfileDto;
    profile.nickname = nickname;
    profile.imageUri = imageUri;

    try {
      await this.userRepository.save(profile);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '프로필 수정 도중 에러가 발생했습니다.',
      );
    }
  }

  async deleteRefreshToken(user: User) {
    try {
      await this.userRepository.update(user.id, { hashedRefreshToken: null });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '토큰을 삭제하는 도중 에러가 발생했습니다.',
      );
    }
  }

  async deleteAccount(user: User) {
    try {
      await this.userRepository
        .createQueryBuilder('user')
        .delete()
        .where('id = :id', { id: user.id })
        .execute();
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        '탈퇴할 수 없습니다. 남은 데이터가 존재하는지 확인해주세요.',
      );
    }
  }

  async updateCategory(
    categories: Record<keyof MarkerColor, string>,
    user: User,
  ) {
    const { RED, YELLOW, BLUE, GREEN, PURPLE } = MarkerColor;

    if (
      Object.keys(categories).every((color: MarkerColor) =>
        [RED, YELLOW, BLUE, GREEN, PURPLE].includes(color),
      )
    ) {
      throw new BadRequestException('유효하지 않은 카테고리입니다.');
    }

    user[RED] = categories[RED];
    user[YELLOW] = categories[YELLOW];
    user[BLUE] = categories[BLUE];
    user[GREEN] = categories[GREEN];
    user[PURPLE] = categories[PURPLE];

    try {
      await this.userRepository.save(user);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '카테고리 수정 도중 에러가 발생했습니다.',
      );
    }

    const { password, hashedRefreshToken, ...resetUser } = user;

    return resetUser;
  }
}
