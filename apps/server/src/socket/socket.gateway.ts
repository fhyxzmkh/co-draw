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
import { BoardsService } from '../boards/boards.service';

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

  constructor(private readonly boardsService: BoardsService) {}

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

  // 监听加入房间事件
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { boardId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { boardId } = data;
    this.logger.log(`Client ${client.id} joining room ${boardId}`);

    client.join(boardId);

    client.emit('joinedRoom', boardId); // 通知客户端已成功加入
  }

  // 监听初始化白板状态事件
  @SubscribeMessage('getInitialState')
  async handleGetInitialState(
    @MessageBody() data: { boardId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { boardId } = data;

    const result = await this.boardsService.findOne(boardId);

    client.emit('initialState', result?.content);
  }

  // 监听 "drawing" 事件
  @SubscribeMessage('drawing')
  handleDrawing(
    @MessageBody() data: { boardId: string; object: any },
    @ConnectedSocket() client: Socket,
  ): void {
    const { boardId, object } = data;

    // 使用 client.to(room).emit(...) 将消息广播给指定房间内的所有其他客户端
    client.to(boardId).emit('drawing', object);
  }

  // 监听 "object:modified" 事件
  @SubscribeMessage('object:modified')
  handleObjectModified(
    @MessageBody() data: { boardId: string; object: any },
    @ConnectedSocket() client: Socket,
  ): void {
    const { boardId, object } = data;
    client.to(boardId).emit('object:modified', object);
  }

  // 监听 "objects:removed" 事件
  @SubscribeMessage('objects:removed')
  handleObjectRemoved(
    @MessageBody() data: { boardId: string; objectIds: string[] },
    @ConnectedSocket() client: Socket,
  ): void {
    const { boardId, objectIds } = data;
    client.to(boardId).emit('objects:removed', objectIds);
  }

  // 监听 "canvas:cleared" 事件
  @SubscribeMessage('canvas:cleared')
  handleCanvasCleared(
    @MessageBody() data: { boardId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { boardId } = data;

    this.server.to(boardId).emit('canvas:cleared');
  }
}
