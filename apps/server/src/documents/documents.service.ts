import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { ResourceTypeEnum } from '../permissions/entities/resource-type.enum';
import { PermissionRoleEnum } from '../permissions/entities/permission-role.enum';
import { CreatePermissionDto } from '../permissions/dto/create-permission.dto';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private permissionsService: PermissionsService,
    private dataSource: DataSource,
  ) {}

  async create(createDocumentDto: CreateDocumentDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const document = this.documentRepository.create(createDocumentDto);
      const obj = await this.documentRepository.save(document);

      if (obj) {
        await this.permissionsService.create({
          resourceId: obj.id,
          resourceType: ResourceTypeEnum.Document,
          userId: obj.ownerId,
          role: PermissionRoleEnum.Owner,
        } as CreatePermissionDto);
      }

      return obj;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.documentRepository.find();
  }

  findOne(id: string) {
    return this.documentRepository.findOneBy({ id });
  }

  update(id: number, updateDocumentDto: UpdateDocumentDto) {
    return this.documentRepository.update(id, updateDocumentDto);
  }

  remove(id: string) {
    return this.documentRepository.delete(id);
  }

  async findMyAll(userId: string) {
    const permissions = await this.permissionsService.findAllBy(
      userId,
      ResourceTypeEnum.Document,
    );

    const documentIds = permissions.map((permission) => permission.resourceId);

    if (documentIds.length === 0) {
      return [];
    }

    return await this.documentRepository.find({
      where: {
        id: In(documentIds),
      },
    });
  }
}
