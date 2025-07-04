import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { BoardsModule } from '../boards/boards.module';
import { SocketGateway } from './socket.gateway';
import { DocumentsModule } from '../documents/documents.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [BoardsModule, DocumentsModule, AuthModule],
  providers: [SocketGateway, SocketService],
})
export class SocketModule {}
