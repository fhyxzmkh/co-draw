import { Body, Controller, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateInvitationDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('/invitation/create')
  createInvitation(@Body() data: CreateInvitationDto) {
    return this.messagesService.createInvitation(data);
  }
}
