import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'public', name: 'board' })
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, nullable: false, unique: true })
  title: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: false, name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'collaborator_ids' })
  collaboratorIds: object | null;

  @Column({ type: 'jsonb', nullable: true })
  content: object | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;
}
