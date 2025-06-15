import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'user' })
export class User {
  @PrimaryColumn('varchar', { length: 32 })
  id: string;

  @Column('varchar', { length: 36, unique: true })
  username: string;

  @Column('varchar', { length: 512 })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
