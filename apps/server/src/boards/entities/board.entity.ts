import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'board' })
export class Board {
  @PrimaryColumn('varchar', { length: 32 })
  id: string;

  @Column('varchar', { length: 32, unique: true })
  title: string;

  @Column('varchar', { length: 128 })
  description: string;

  @Column('varchar', { length: 32, name: 'owner_id' })
  ownerId: string;

  @Column('json')
  content: JSON;

  @Column('json', { name: 'collaborator_id' })
  collaboratorId: JSON;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
