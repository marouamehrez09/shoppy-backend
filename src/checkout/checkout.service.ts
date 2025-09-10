import { ConfigService } from '@nestjs/config';
import { ProductsService } from './../products/products.service';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import Stripe from 'stripe';

@Injectable()
export class CheckoutService {
  private stripe: Stripe;

  constructor(
    productService: ProductsService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2025-07-30.basil',
      },
    );
    this.productService = productService;
  }

  private readonly productService: ProductsService;

  async createSession(productId: number) {
    const product = await this.productService.getProduct(productId);

    return this.stripe.checkout.sessions.create({
      metadata: {
        productId: product.id.toString(),
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

  async handleCheckoutWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body as Buffer, // ⚠️ raw body
        sig as string,
        this.configService.getOrThrow('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      console.error(
        '❌ Webhook signature verification failed:',
        (err as Error).message,
      );
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    // Vérifier le type d’événement
    if (event.type === 'checkout.session.completed') {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const session = event.data.object as Stripe.Checkout.Session;

      const productId = session.metadata?.productId;
      if (!productId) {
        console.error('❌ Product ID is missing in session metadata');
        return res.status(400).send('Product ID missing');
      }

      // Marquer le produit comme vendu
      await this.productService.update(parseInt(productId), {
        sold: true,
      });

      console.log(`✅ Product ${productId} marked as sold.`);
    }

    return res.json({ received: true });
  }
}
