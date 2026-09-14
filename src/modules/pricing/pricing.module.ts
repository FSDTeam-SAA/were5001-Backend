import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Valute, ValuteSchema } from './schemas/valute.schema';
import { ItemsPrice, ItemsPriceSchema } from './schemas/items-price.schema';
import { PaymentGateway, PaymentGatewaySchema } from './schemas/payment.schema';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Valute.name, schema: ValuteSchema },
      { name: ItemsPrice.name, schema: ItemsPriceSchema },
      { name: PaymentGateway.name, schema: PaymentGatewaySchema },
    ]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService, MongooseModule],
})
export class PricingModule {}
