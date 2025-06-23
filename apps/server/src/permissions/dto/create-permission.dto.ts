import { ResourceTypeEnum } from '../entities/resource-type.enum';
import { PermissionRoleEnum } from '../entities/permission-role.enum';

export class CreatePermissionDto {
  resourceId: string;
  resourceType: ResourceTypeEnum;
  userId: string;
  role: PermissionRoleEnum;
}
