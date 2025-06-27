import { Injectable, Logger } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { DataSource, In, Repository } from 'typeorm';
import { PermissionsService } from '../permissions/permissions.service';
import { ResourceTypeEnum } from '../permissions/entities/resource-type.enum';
import { PermissionRoleEnum } from '../permissions/entities/permission-role.enum';
import { CreatePermissionDto } from '../permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from '../permissions/dto/update-permission.dto';

@Injectable()
export class BoardsService {
  private readonly logger = new Logger('BoardsService');

  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    private permissionsService: PermissionsService,
    private dataSource: DataSource,
  ) {}

  async create(createBoardDto: CreateBoardDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newBoard = this.boardRepository.create(createBoardDto);

      const obj = await this.boardRepository.save(newBoard);

      if (obj) {
        await this.permissionsService.create({
          resourceId: obj.id,
          resourceType: ResourceTypeEnum.Board,
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
    return this.boardRepository.find();
  }

  findOne(id: string) {
    return this.boardRepository.findOneBy({ id });
  }

  update(id: string, updateBoardDto: UpdateBoardDto) {
    return this.boardRepository.update(id, updateBoardDto);
  }

  async remove(userId: string, fileId: string) {
    await this.permissionsService.removeBy(userId, fileId);
    return this.boardRepository.delete(fileId);
  }

  async findMyAll(userId: string) {
    const permissions = await this.permissionsService.findAllBy(
      userId,
      ResourceTypeEnum.Board,
    );

    const boardIds = permissions.map((permission) => permission.resourceId);

    if (boardIds.length === 0) {
      return [];
    }

    return await this.boardRepository.find({
      where: {
        id: In(boardIds),
      },
    });
  }

  async findMyRole(userId: string, boardId: string) {
    const p = await this.permissionsService.findOneBy(
      userId,
      boardId,
      ResourceTypeEnum.Board,
    );

    return p?.role;
  }

  async findAllParticipants(boardId: string) {
    return await this.permissionsService.findAllParticipantsByResourceId(
      boardId,
    );
  }

  async updateRole(data: UpdatePermissionDto) {
    return await this.permissionsService.updateRole(data);
  }

  async deleteRole(data: UpdatePermissionDto) {
    return await this.permissionsService.deleteRole(data);
  }
}
