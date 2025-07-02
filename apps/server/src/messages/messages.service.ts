import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateInvitationDto } from './dto/create-message.dto';
import { MessageTypeEnum } from './entities/message-type.enum';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
    private dataSource: DataSource,
  ) {}

  async createInvitation(data: CreateInvitationDto) {
    const user = await this.usersService.findOneByUsername(data.toUsername);

    if (!user) {
      throw new NotFoundException('邀请的用户不存在');
    }

    if (data.fromUserId === user.id) {
      throw new NotFoundException('不能邀请自己');
    }

    const message = this.messageRepository.create(data);
    message.toUserId = user.id;
    message.title = `协作邀请`;
    message.content = `用户“${user.username}”\n邀请您作为“${data.permission}”加入协作~`;
    message.type = MessageTypeEnum.Invitation;
    message.resourceId = data.resourceId;
    message.resourcePermission = data.permission;
    message.resourceType = data.resourceType;

    return await this.messageRepository.save(message);
  }

  async findInvitationList(userId: string) {
    return await this.messageRepository.find({
      where: { toUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateInvitation(invitationId: string, opt: number) {
    if (opt !== 1 && opt !== 0) {
      throw new BadRequestException('请求参数异常');
    }

    const message = await this.messageRepository.findOneBy({
      id: invitationId,
    });

    if (!message) {
      throw new BadRequestException('内部异常');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (opt === 1) {
        await this.permissionsService.create({
          resourceId: message.resourceId,
          resourceType: message.resourceType,
          userId: message.toUserId,
          role: message.resourcePermission,
        });
      }

      return await this.messageRepository.update(message.id, {
        confirmed: true,
      });
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
