import { PartialType } from '@nestjs/mapped-types';
import { Permission } from '../entities/permission.entity';

export class UpdatePermissionDto extends PartialType(Permission) {}
