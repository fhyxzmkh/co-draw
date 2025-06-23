import { Injectable, Logger } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { ResourceTypeEnum } from './entities/resource-type.enum';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger('PermissionsService');

  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  create(createPermissionDto: CreatePermissionDto) {
    const permission = this.permissionsRepository.create(createPermissionDto);
    return this.permissionsRepository.save(permission);
  }

  async findAllBy(userId: string, type: ResourceTypeEnum) {
    return await this.permissionsRepository.findBy({
      userId: userId,
      resourceType: type,
    });
  }

  async removeBy(userId: string, fileId: string) {
    await this.permissionsRepository.delete({
      userId: userId,
      resourceId: fileId,
    });
  }
}
