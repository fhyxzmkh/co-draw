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
import * as Y from 'yjs';
import { UpdatePermissionDto } from '../permissions/dto/update-permission.dto';

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

  update(id: string, updateDocumentDto: UpdateDocumentDto) {
    return this.documentRepository.update(id, updateDocumentDto);
  }

  async remove(userId: string, fileId: string) {
    await this.permissionsService.removeBy(userId, fileId);
    return this.documentRepository.delete(fileId);
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

  // 从数据库加载文档内容
  async getDocumentContent(documentId: string): Promise<Uint8Array | null> {
    const doc = await this.documentRepository.findOneBy({ id: documentId });

    return doc ? doc.content : null;
  }

  // 将文档更新合并并保存到数据库
  async saveDocumentUpdate(documentId: string, update: Uint8Array) {
    const doc = await this.documentRepository.findOneBy({ id: documentId });
    const ydoc = new Y.Doc();

    // 如果已有内容，先加载
    if (doc && doc.content) {
      Y.applyUpdate(ydoc, doc.content);
    }

    // 应用新的更新
    Y.applyUpdate(ydoc, update);

    // 将合并后的完整状态保存回数据库
    const fullState = Y.encodeStateAsUpdate(ydoc);
    await this.documentRepository.update(documentId, { content: fullState });
  }

  async findMyRole(userId: string, documentId: string) {
    const p = await this.permissionsService.findOneBy(
      userId,
      documentId,
      ResourceTypeEnum.Document,
    );

    return p?.role;
  }

  async findAllParticipants(documentId: string) {
    return await this.permissionsService.findAllParticipantsByResourceId(
      documentId,
    );
  }

  async updateRole(data: UpdatePermissionDto) {
    return await this.permissionsService.updateRole(data);
  }

  async deleteRole(data: UpdatePermissionDto) {
    return await this.permissionsService.deleteRole(data);
  }
}
