import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    // 从 cookie 中提取 token
    const token = this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_KEY,
      });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    // 从 request.cookies 对象中获取 access_token
    const accessToken = request.cookies['access_token'];
    if (!accessToken) {
      return undefined;
    }

    const [type, token] = accessToken.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
