import { PermissionRoleEnum } from '../../permissions/entities/permission-role.enum';
import { ResourceTypeEnum } from '../../permissions/entities/resource-type.enum';

export class CreateMessageDto {}

export class CreateInvitationDto {
  fromUserId: string;
  toUsername: string;
  resourceId: string;
  permission: PermissionRoleEnum;
  resourceType: ResourceTypeEnum;
}
