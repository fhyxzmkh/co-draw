import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateInvitationDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('/invitation/create')
  createInvitation(@Body() data: CreateInvitationDto) {
    return this.messagesService.createInvitation(data);
  }

  @Get('/invitation/list')
  findInvitationList(@Query('userId') userId: string) {
    return this.messagesService.findInvitationList(userId);
  }

  @Patch('/invitation')
  updateInvitation(
    @Query('invitationId') invitationId: string,
    @Query('opt') opt: string,
  ) {
    return this.messagesService.updateInvitation(invitationId, +opt);
  }
}
