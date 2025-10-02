import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Récupère l'historique d'achat de l'utilisateur connecté
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyOrders(@CurrentUser() user: TokenPayload) {
    return this.ordersService.findByUser(user.userId);
  }

  @UseGuards(JwtAuthGuard) // 👈 tu peux remplacer ou ajouter un guard d'admin si nécessaire
  @Get('all')
  async getAllOrders() {
    return this.ordersService.findAll();
  }
}
