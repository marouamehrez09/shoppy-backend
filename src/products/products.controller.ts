import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateProductRequest } from './dto/create-product.request';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProductsService } from './products.service';
import type { TokenPayload } from '../auth/token-payload.interface';
import { Put, Delete } from '@nestjs/common';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  async createProduct(
    @Body() body: CreateProductRequest,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.productsService.createProduct(body, user.userId);
  }

  @Get()
  //@UseGuards(JwtAuthGuard)
  async getProducts(@Query('status') status?: string) {
    return this.productsService.getProducts(status);
  }

  @Get(':productId')
  //@UseGuards(JwtAuthGuard)
  async getProduct(@Param('productId') productId: string) {
    return this.productsService.getProduct(+productId);
  }

  @Put(':productId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateProduct(
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    await this.productsService.update(parseInt(productId), body);
    return { success: true };
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteProduct(@Param('productId') productId: string) {
    this.productsService.deleteProduct(+productId);
    return { success: true };
  }
  Z;
}
