import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateInvitationDto } from './dto/create-message.dto';
import { MessageTypeEnum } from './entities/message-type.enum';
import { PermissionRoleEnum } from '../permissions/entities/permission-role.enum';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly usersService: UsersService,
  ) {}

  async createInvitation(data: CreateInvitationDto) {
    const user = await this.usersService.findOneByUsername(data.toUsername);

    if (!user) {
      throw new NotFoundException('邀请的用户不存在');
    }

    const message = this.messageRepository.create(data);
    message.toUserId = user.id;
    message.title = `协作邀请`;
    message.content = `用户“${user.username}”邀请您作为“${data.permission}”加入协作~`;
    message.type = MessageTypeEnum.Invitation;
    message.resourceId = data.resourceId;
    message.resourcePermission = data.permission;

    return await this.messageRepository.save(message);
  }
}
