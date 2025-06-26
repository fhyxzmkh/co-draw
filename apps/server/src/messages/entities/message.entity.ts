import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageTypeEnum } from './message-type.enum';
import { ResourceTypeEnum } from '../../permissions/entities/resource-type.enum';
import { PermissionRoleEnum } from '../../permissions/entities/permission-role.enum';

@Entity({ schema: 'public', name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'from_user_id' })
  fromUserId: string;

  @Column({ type: 'uuid', nullable: false, name: 'to_user_id' })
  toUserId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  content: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  confirmed: boolean;

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

  @Column({ type: 'enum', nullable: false, enum: MessageTypeEnum })
  type: MessageTypeEnum;

  @Column({ type: 'uuid', nullable: true, name: 'resource_id' })
  resourceId: string;

  @Column({
    type: 'enum',
    nullable: true,
    enum: PermissionRoleEnum,
    name: 'resource_permission',
  })
  resourcePermission: PermissionRoleEnum;
}
