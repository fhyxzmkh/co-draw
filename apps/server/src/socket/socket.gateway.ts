import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway(6788, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  // 网关初始化
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  // 处理客户端连接
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // 你可以在这里进行用户认证、加入房间等操作
  }

  // 处理客户端断开连接
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 加入房间事件
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    client.emit('joinedRoom', room); // 通知客户端已成功加入
  }
}
