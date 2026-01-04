import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { MarkerColor } from '@/post/marker-color.enum';
import { Favorite } from '@/favorite/favorite.entity';
import { Post } from '@/post/post.entity';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  loginType: 'email' | 'kakao' | 'apple';

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname?: string;

  @Column({ nullable: true })
  imageUri?: string;

  @Column({ nullable: true })
  kakaoImageUri?: string;

  @Column({ nullable: true, default: '' })
  [MarkerColor.RED]: string;

  @Column({ nullable: true, default: '' })
  [MarkerColor.YELLOW]: string;

  @Column({ nullable: true, default: '' })
  [MarkerColor.GREEN]: string;

  @Column({ nullable: true, default: '' })
  [MarkerColor.BLUE]: string;

  @Column({ nullable: true, default: '' })
  [MarkerColor.PURPLE]: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  hashedRefreshToken?: string | null;

  @OneToMany(() => Post, (post) => post.user, { eager: false })
  post: Post[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}
