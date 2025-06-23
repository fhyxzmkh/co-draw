import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/register')
  async register(
    @Body() userInfo: RegisterDto,
    @Ip() clientIp: string,
  ): Promise<any> {
    return await this.authService.register({ ...userInfo, clientIp });
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(
    @Body() userInfo: LoginDto,
    @Ip() clientIp: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<any> {
    const result = await this.authService.login({ ...userInfo, clientIp });
    if (result) {
      response.cookie('access_token', 'Bearer ' + result.access_token, {
        httpOnly: true, // 关键：设置为 HTTP-only，JS 无法访问
        path: '/',
        secure: false, // 生产环境建议设置为 true，只通过 HTTPS 发送
        maxAge: 3600000, // Cookie 有效期，例如 1 小时 (单位毫秒)
        // sameSite: 'lax', // 防止 CSRF 攻击，根据需求设置
      });
      return { message: 'success' };
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('/profile')
  getProfile(@Request() req): any {
    return req.user;
  }
}
