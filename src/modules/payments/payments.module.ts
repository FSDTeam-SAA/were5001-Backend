import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/payment-transaction.schema';
import { PayPalService } from './services/paypal.service';
import { SkrillService } from './services/skrill.service';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayPalService, SkrillService],
  exports: [PaymentsService, PayPalService, SkrillService, MongooseModule],
})
export class PaymentsModule {}
