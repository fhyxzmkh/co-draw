import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { BoardsModule } from '../boards/boards.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [BoardsModule],
  providers: [SocketGateway, SocketService],
})
export class SocketModule {}
