import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductRequest } from './dto/create-product.request';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsGateway } from './products.gateway';
import { promises as fs } from 'fs';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productsGateway: ProductsGateway,
  ) {}

  async createProduct(data: CreateProductRequest, userId: number) {
    // On enregistre directement l’URL Cloudinary
    const product = await this.prismaService.product.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        image: data.image,
        userId,
      },
    });
    this.productsGateway.handleProductUpdated();
    return product;
  }

  async getProducts(status?: string) {
    const args: Prisma.ProductFindManyArgs = {};
    if (status === 'availible') {
      args.where = { sold: false };
    }

    const products = await this.prismaService.product.findMany(args);
    // On renvoie directement l’URL stockée dans la BDD
    return products;
  }

  async getProduct(productId: number) {
    try {
      return await this.prismaService.product.findFirstOrThrow({
        where: { id: productId },
      });
    } catch (err) {
      throw new NotFoundException(`Product not found with ID ${productId}`);
    }
  }

  async update(productId: number, data: Prisma.ProductUpdateInput) {
    console.log('data', data);
    await this.prismaService.product.update({
      where: { id: productId },
      data,
    });
    this.productsGateway.handleProductUpdated();
  }

  async deleteProduct(productId: number) {
    // Vérifier si le produit est lié à une commande
    const existingOrder = await this.prismaService.order.findFirst({
      where: { productId },
    });

    if (existingOrder) {
      throw new BadRequestException(
        'Impossible de supprimer : le produit est lié à une commande.',
      );
    }

    // Supprimer le produit sinon
    await this.prismaService.product.delete({
      where: { id: productId },
    });

    // Notifier les clients en temps réel
    this.productsGateway.handleProductUpdated();
  }

  private async imageExists(productId: number): Promise<boolean> {
    try {
      await fs.access(`./public/images/${productId}.jpg`, fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }
}
