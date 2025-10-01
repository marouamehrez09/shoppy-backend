import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ user?: TokenPayload }>();
    const token = req.user as TokenPayload;
    if (!token) throw new ForbiddenException('Not authenticated');
    const user = await this.usersService.getUser({ id: token.userId });
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return true;
  }
}
