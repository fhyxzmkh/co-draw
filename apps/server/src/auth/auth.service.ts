import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { generateCustomNanoId } from 'src/tools/security-tools';
import { verifyTurnstileToken } from '../tools/cloudflare-tools';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger('AuthService');
  private readonly saltRounds = 10;

  async validateUser(username: string, pass: string): Promise<boolean> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && user.password) {
      return await bcrypt.compare(pass, user.password);
    }
    return false;
  }

  async register(userInfo: RegisterDto): Promise<any> {
    const idempotencyKey = crypto.randomUUID();
    const { username, password, turnstileToken, clientIp, confirmPassword } =
      userInfo;

    if (
      !turnstileToken ||
      !clientIp ||
      turnstileToken === '' ||
      !username ||
      !password ||
      !confirmPassword
    ) {
      this.logger.error('Missing required verification parameters.');
      throw new UnauthorizedException(
        'Missing required verification parameters.',
      );
    }

    if (password !== confirmPassword) {
      this.logger.error('Passwords do not match.');
      throw new UnauthorizedException('Passwords do not match.');
    }

    const verificationResult = await verifyTurnstileToken(
      turnstileToken,
      clientIp,
      idempotencyKey,
    );

    if (!verificationResult.success) {
      this.logger.error(
        'Turnstile verification failed:',
        verificationResult['error-codes'],
      );
      throw new UnauthorizedException(
        'Turnstile verification failed. Please try again.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    const registerResult = await this.usersService.createUser({
      id: generateCustomNanoId(32),
      username: username,
      password: hashedPassword,
    });

    if (!registerResult) {
      this.logger.error('User registration failed.');
      throw new UnauthorizedException('User registration failed.');
    }

    return { message: 'success' };
  }

  async login(userInfo: LoginDto): Promise<any> {
    const { username, password, turnstileToken, clientIp } = userInfo;

    if (
      !turnstileToken ||
      !clientIp ||
      turnstileToken === '' ||
      !username ||
      !password
    ) {
      this.logger.error('Missing required verification parameters.');
      throw new UnauthorizedException(
        'Missing required verification parameters.',
      );
    }

    const idempotencyKey = crypto.randomUUID();
    const verificationResult = await verifyTurnstileToken(
      turnstileToken,
      clientIp,
      idempotencyKey,
    );

    if (!verificationResult.success) {
      this.logger.error(
        'Turnstile verification failed:',
        verificationResult['error-codes'],
      );
      throw new UnauthorizedException(
        'Turnstile verification failed. Please try again.',
      );
    }

    const isMatch = await this.validateUser(username, password);
    if (!isMatch) {
      this.logger.error('Invalid username or password.');
      throw new UnauthorizedException('Invalid username or password.');
    }

    const user = await this.usersService.findOneByUsername(username);
    const payload = { sub: user?.id, username: user?.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
