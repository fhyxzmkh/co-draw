import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import * as cookie from 'cookie'; // 推荐使用 cookie 库

// 定义一个更安全的 Socket 类型
interface AuthSocket extends Socket {
  data: {
    user?: any;
  };
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger: Logger = new Logger(WsAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService, // 推荐使用 ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthSocket = context.switchToWs().getClient<AuthSocket>();
    this.logger.log(`[Auth] Attempting to authenticate client: ${client.id}`);

    const token = this.extractTokenFromHandshake(client);
    if (!token) {
      this.handleError(
        client,
        'No token provided or token format is incorrect.',
      );
      return false;
    }

    try {
      this.logger.log(`[Auth] Verifying token for client: ${client.id}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload: any = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_KEY'),
      });

      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `[Auth] Token verified successfully for user: ${payload.sub || payload.username}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      client.data.user = payload;
    } catch (error: any) {
      this.logger.error(`[Auth] Token verification failed: ${error.message}`);
      this.handleError(client, 'Invalid token');
      return false;
    }

    this.logger.log(`[Auth] Client ${client.id} authenticated successfully.`);
    return true;
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    const cookieString = client.handshake.headers.cookie;
    this.logger.log(`[Auth] Raw cookie header: ${cookieString}`);

    if (!cookieString) {
      this.logger.warn('[Auth] No cookie string found in handshake headers.');
      return undefined;
    }

    const cookies = cookie.parse(cookieString);
    const accessToken = cookies['access_token'];

    if (!accessToken) {
      this.logger.warn('[Auth] "access_token" not found in parsed cookies.');
      return undefined;
    }

    this.logger.log(`[Auth] Found raw access_token: ${accessToken}`);

    try {
      const [type, token] = decodeURIComponent(accessToken).split(' ') ?? [];
      this.logger.log(`[Auth] Token type: "${type}", Token exists: ${!!token}`);
      return type === 'Bearer' ? token : undefined;
    } catch (e) {
      this.logger.error(
        `[Auth] Failed to decode and split access_token: ${e.message}`,
      );
      return undefined;
    }
  }

  private handleError(client: Socket, message: string) {
    this.logger.warn(
      `[Auth] Authentication error for client ${client.id}: ${message}`,
    );
    // WsException 是 WebSocket 版本的 HttpException
    client.emit('error', new WsException(message));
    client.disconnect(); // 主动断开连接
    this.logger.log(
      `[Auth] Disconnected client ${client.id} due to auth error.`,
    );
  }
}
