import { Injectable, Logger } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { ResourceTypeEnum } from './entities/resource-type.enum';
import { UsersService } from '../users/users.service';
import { PermissionRoleEnum } from './entities/permission-role.enum';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger('PermissionsService');

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    private readonly usersService: UsersService,
  ) {}

  // 创建一条权限记录
  create(createPermissionDto: CreatePermissionDto) {
    const permission = this.permissionsRepository.create(createPermissionDto);
    return this.permissionsRepository.save(permission);
  }

  // 根据用户ID和资源类型查找所有权限
  async findAllBy(userId: string, type: ResourceTypeEnum) {
    return await this.permissionsRepository.findBy({
      userId: userId,
      resourceType: type,
    });
  }

  // 根据用户ID和资源ID查找权限
  async removeBy(userId: string, fileId: string) {
    await this.permissionsRepository.delete({
      userId: userId,
      resourceId: fileId,
    });
  }

  // 根据用户ID、资源ID和资源类型查找单条权限记录
  async findOneBy(userId: string, fileId: string, type: ResourceTypeEnum) {
    return await this.permissionsRepository.findOneBy({
      userId: userId,
      resourceId: fileId,
      resourceType: type,
    });
  }

  // 根据资源ID查找所有参与者
  async findAllParticipantsByResourceId(fileId: string) {
    const permissions = await this.permissionsRepository.findBy({
      resourceId: fileId,
    });

    if (permissions.length === 0) {
      return [];
    }

    const userIdToRoleMap = new Map<string, PermissionRoleEnum>();
    permissions.forEach((p) => {
      userIdToRoleMap.set(p.userId, p.role);
    });

    const userIds = Array.from(userIdToRoleMap.keys());

    const users = await this.usersService.findByIds(userIds);

    return users.map((user) => {
      const role = userIdToRoleMap.get(user.id);
      return {
        ...user, // 展开用户的所有属性
        role: role, // 添加 role 属性
      };
    });
  }
}
