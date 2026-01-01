import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { User } from './auth.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private config: ConfigService,
  ) {
    super({
      secretOrKey: config.get('JWT_SECRET') as string,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: { email: string }) {
    const { email } = payload;
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
