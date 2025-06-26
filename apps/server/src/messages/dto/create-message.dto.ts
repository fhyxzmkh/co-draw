import { PermissionRoleEnum } from '../../permissions/entities/permission-role.enum';

export class CreateMessageDto {}

export class CreateInvitationDto {
  fromUserId: string;
  toUsername: string;
  resourceId: string;
  permission: PermissionRoleEnum;
}
