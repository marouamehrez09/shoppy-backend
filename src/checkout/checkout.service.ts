import { ConfigService } from '@nestjs/config';
import { ProductsService } from './../products/products.service';
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly stripe: Stripe,
    private readonly productService: ProductsService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async createSession(productId: number, userId: number) {
    const product = await this.productService.getProduct(productId);

    return this.stripe.checkout.sessions.create({
      metadata: {
        productId: product.id.toString(),
        userId: userId.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: product.price * 100,
            product_data: {
              name: product.name,
              description: product.description,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: this.configService.getOrThrow('STRIPE_SUCCESS_URL'),
      cancel_url: this.configService.getOrThrow('STRIPE_CANCEL_URL'),
    });
  }

  async handleCheckoutWebhook(event: any) {
    //console.log('event', event);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = await this.stripe.checkout.sessions.retrieve(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      event.data.object.id,
    );

    const productId = session.metadata?.productId;
    const userId = session.metadata?.userId;

    if (!productId || !userId) {
      throw new Error('Product ID or User ID missing in session metadata');
    }

    // marquer produit comme vendu
    await this.productService.update(parseInt(productId), { sold: true });

    // créer une commande
    await this.ordersService.create(parseInt(userId), parseInt(productId));
  }
}
