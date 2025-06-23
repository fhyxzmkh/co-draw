import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PermissionRoleEnum } from './permission-role.enum';
import { ResourceTypeEnum } from './resource-type.enum';

@Entity({ schema: 'public', name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'resource_id' })
  resourceId: string;

  @Column({
    type: 'enum',
    nullable: false,
    name: 'resource_type',
    enum: ResourceTypeEnum,
  })
  resourceType: ResourceTypeEnum;

  @Column({ type: 'uuid', nullable: false, name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', nullable: false, enum: PermissionRoleEnum })
  role: PermissionRoleEnum;
}
