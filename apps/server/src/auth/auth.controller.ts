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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
  ): Promise<any> {
    return await this.authService.login({ ...userInfo, clientIp });
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('/profile')
  getProfile(@Request() req): any {
    return req.user;
  }
}
