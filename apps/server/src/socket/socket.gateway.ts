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
import { BadRequestException, Logger, UseGuards } from '@nestjs/common';
import { BoardsService } from '../boards/boards.service';
import { DocumentsService } from '../documents/documents.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { WsAuthGuard } from '../auth/ws-auth.guard';
import { ActiveDocsService } from '../documents/active-docs.service';
import * as Y from 'yjs';

@UseGuards(WsAuthGuard)
@WebSocketGateway(10011, {
  cors: {
    origin: ['http://localhost:3000', 'https://co-draw-alpha.vercel.app'],
    credentials: true,
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly boardsService: BoardsService,
    private readonly documentsService: DocumentsService,
    private readonly activeDocsService: ActiveDocsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

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
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = client.data.user?.sub;
    if (!userId) return;

    // 1. 从 Redis 获取该用户加入的所有房间列表
    const userRoomsKey = `user:rooms:${userId}`;
    const joinedRooms = await this.redis.smembers(userRoomsKey);

    this.logger.log(
      `User ${userId} disconnecting from rooms: ${joinedRooms.join(', ')}`,
    );

    for (const resourceId of joinedRooms) {
      try {
        const presenceKey = `codraw:presence:${resourceId}`;

        const onlineCount = await this.redis.scard(presenceKey); // scard 获取集合大小

        if (onlineCount === 1) {
          // 如果是最后一个离开的用户，触发保存
          const ydoc = this.activeDocsService.get(resourceId);
          if (ydoc) {
            const finalState = Y.encodeStateAsUpdate(ydoc);
            await this.documentsService.saveFullDocument(
              resourceId,
              finalState,
            );
            // 保存后销毁内存中的实例，释放内存
            this.activeDocsService.destroy(resourceId);
          }
        }

        // 从房间的在线列表中移除用户
        await this.redis.srem(presenceKey, userId);

        // 广播用户离开事件
        this.server.to(resourceId).emit('user:left', { resourceId, userId });
      } catch (error) {
        this.logger.error(
          `Error during disconnect cleanup for user ${userId} in room ${resourceId}`,
          error,
        );
      }
    }

    // 4. 清理该用户的房间列表记录
    if (joinedRooms.length > 0) {
      await this.redis.del(userRoomsKey);
    }
  }

  // 监听加入房间事件
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { resourceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { resourceId } = data;
    const user = client.data.user;

    this.logger.log(
      `User ${user.username} (ID: ${user.sub}) subscribing to resource ${resourceId}`,
    );

    client.join(resourceId);

    // 1. 更新房间的在线列表
    const presenceKey = `codraw:presence:${resourceId}`;
    await this.redis.sadd(presenceKey, user.sub);

    // 2. 将当前房间ID添加到该用户的房间集合中
    const userRoomsKey = `user:rooms:${user.sub}`;
    await this.redis.sadd(userRoomsKey, resourceId);

    // 广播新用户加入
    this.server.to(resourceId).emit('user:joined', {
      resourceId,
      user: { id: user.sub, username: user.username },
    });

    client.emit('subscribed', { resourceId });
  }

  // 处理获取在线列表的请求
  @SubscribeMessage('presence:get')
  async handleGetPresence(
    @MessageBody() resourceId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const redisKey = `codraw:presence:${resourceId}`;
    const onlineUserIds = await this.redis.smembers(redisKey);
    // 只向请求者返回当前完整的在线列表
    client.emit('presence:state', { resourceId, userIds: onlineUserIds });
  }

  // --- 具体业务 ---
  // 监听初始化白板状态事件
  @SubscribeMessage('board:load')
  async handleBoardLoad(
    @MessageBody() data: { boardId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { boardId } = data;

    const result = await this.boardsService.findOne(boardId);

    client.emit('board:state', result?.content);
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

  // 请求加载文档的初始状态
  @SubscribeMessage('doc:load')
  async handleDocLoad(
    @MessageBody() data: { documentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId } = data;

    let ydoc = this.activeDocsService.get(documentId);

    if (!ydoc) {
      // 如果内存中没有，从数据库加载并创建
      const dbContent =
        await this.documentsService.getDocumentContent(documentId);
      if (!dbContent) {
        this.logger.warn(`Document ${documentId} not found in DB.`);
        throw new BadRequestException('Document not found');
      }
      ydoc = this.activeDocsService.create(documentId, dbContent);
      this.logger.log(`Document ${documentId} loaded from DB into memory.`);
    }

    // 将当前内存中的完整状态发给新加入的客户端
    const fullState = Y.encodeStateAsUpdate(ydoc);
    client.emit('doc:state', { documentId, state: fullState });
  }

  // 转发文档的增量更新
  @SubscribeMessage('doc:update')
  handleDocUpdate(
    @MessageBody() data: { documentId: string; update: Uint8Array },
    @ConnectedSocket() client: Socket,
  ) {
    // 原封不动地将二进制更新广播给房间内其他客户端
    client.to(data.documentId).emit('doc:update', {
      documentId: data.documentId,
      update: data.update,
    });

    const ydoc = this.activeDocsService.get(data.documentId);
    if (ydoc) {
      Y.applyUpdate(ydoc, data.update, client.id);
    }
  }

  // 转发光标/在线状态更新
  @SubscribeMessage('doc:awareness')
  handleDocAwareness(
    @MessageBody() data: { documentId: string; awarenessUpdate: any },
    @ConnectedSocket() client: Socket,
  ) {
    // 原封不动地广播给房间内的其他人
    client.to(data.documentId).emit('doc:awareness', {
      documentId: data.documentId,
      awarenessUpdate: data.awarenessUpdate,
    });
  }
}
