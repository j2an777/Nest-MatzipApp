import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

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
    const { accessToken, refreshToken } = await this.getTokens({ email });

    if (!user.hashedRefreshToken) {
      throw new ForbiddenException();
    }

    await this.updateHashedRefreshToken(id, refreshToken);
  }
}
