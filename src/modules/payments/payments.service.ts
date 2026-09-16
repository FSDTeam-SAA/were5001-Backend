import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
  PaymentGatewayType,
  PaymentStatus,
} from './schemas/payment-transaction.schema';
import { PayPalService } from './services/paypal.service';
import { SkrillService } from './services/skrill.service';
import {
  CreatePayPalOrderDto,
  CreateSkrillPaymentDto,
  SkrillIpnDto,
  QueryTransactionDto,
} from './dto/payment.dto';
import { createPaginationInfo } from '../../common/utils/pagination.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(PaymentTransaction.name)
    private readonly transactionModel: Model<PaymentTransactionDocument>,
    private readonly paypalService: PayPalService,
    private readonly skrillService: SkrillService,
  ) {}

  // ─── PayPal Operations ───────────────────────────────────────────────────────
  async createPayPalOrder(dto: CreatePayPalOrderDto, userId?: string) {
    // 1. Create a pending transaction record
    const transaction = await this.transactionModel.create({
      userId:
        userId && Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : undefined,
      customerEmail: dto.customerEmail,
      gateway: PaymentGatewayType.PAYPAL,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      productType: dto.productType,
      productDetails: dto.productDetails || {},
      status: PaymentStatus.PENDING,
    });

    try {
      // 2. Call PayPal Orders API
      const paypalOrder = await this.paypalService.createOrder({
        amount: dto.amount,
        currency: dto.currency,
        customId: transaction._id.toString(),
        description: `${dto.productType.toUpperCase()} Purchase`,
        returnUrl: dto.returnUrl,
        cancelUrl: dto.cancelUrl,
      });

      // 3. Update transaction with PayPal order id
      transaction.gatewayOrderId = paypalOrder.orderId;
      transaction.gatewayRawResponse = paypalOrder.raw;
      await transaction.save();

      return {
        message: 'PayPal order created successfully',
        data: {
          transactionId: transaction._id,
          gatewayOrderId: paypalOrder.orderId,
          approveUrl: paypalOrder.approveUrl,
          status: transaction.status,
        },
      };
    } catch (err: any) {
      transaction.status = PaymentStatus.FAILED;
      await transaction.save();
      throw err;
    }
  }

  async capturePayPalOrder(orderId: string) {
    const transaction = await this.transactionModel.findOne({
      $or: [
        { gatewayOrderId: orderId },
        ...(Types.ObjectId.isValid(orderId) ? [{ _id: orderId }] : []),
      ],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction for PayPal order '${orderId}' not found`,
      );
    }

    const targetOrderId = transaction.gatewayOrderId || orderId;
    const captureResult = await this.paypalService.captureOrder(targetOrderId);

    transaction.gatewayTransactionId = captureResult.captureId;
    transaction.gatewayRawResponse = captureResult.raw;

    if (
      captureResult.status === 'COMPLETED' ||
      captureResult.captureStatus === 'COMPLETED'
    ) {
      transaction.status = PaymentStatus.COMPLETED;
    } else {
      transaction.status = PaymentStatus.FAILED;
    }

    await transaction.save();

    return {
      message: 'PayPal order captured successfully',
      data: transaction,
    };
  }

  async handlePayPalWebhook(headers: Record<string, string>, body: any) {
    const isValid = await this.paypalService.verifyWebhookSignature({
      headers,
      body,
    });
    if (!isValid) {
      throw new BadRequestException('Invalid PayPal webhook signature');
    }

    const eventType = body.event_type;
    const resource = body.resource;
    this.logger.log(`Received PayPal Webhook event: ${eventType}`);

    if (
      eventType === 'CHECKOUT.ORDER.COMPLETED' ||
      eventType === 'PAYMENT.CAPTURE.COMPLETED'
    ) {
      const orderId =
        resource?.supplementary_data?.related_ids?.order_id || resource?.id;
      const customId = resource?.custom_id;

      const query: Record<string, any>[] = [];
      if (orderId) query.push({ gatewayOrderId: orderId });
      if (customId && Types.ObjectId.isValid(customId))
        query.push({ _id: customId });

      if (query.length > 0) {
        const transaction = await this.transactionModel.findOne({ $or: query });
        if (transaction && transaction.status !== PaymentStatus.COMPLETED) {
          transaction.status = PaymentStatus.COMPLETED;
          transaction.gatewayTransactionId =
            resource?.id || transaction.gatewayTransactionId;
          transaction.gatewayRawResponse = body;
          await transaction.save();
          this.logger.log(
            `Transaction ${(transaction._id as Types.ObjectId).toString()} marked COMPLETED via PayPal webhook`,
          );
        }
      }
    }

    return { received: true };
  }

  // ─── Skrill Operations ───────────────────────────────────────────────────────
  async createSkrillPayment(dto: CreateSkrillPaymentDto, userId?: string) {
    // 1. Create a pending transaction record
    const transaction = await this.transactionModel.create({
      userId:
        userId && Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : undefined,
      customerEmail: dto.customerEmail,
      gateway: PaymentGatewayType.SKRILL,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      productType: dto.productType,
      productDetails: dto.productDetails || {},
      status: PaymentStatus.PENDING,
    });

    const transactionIdStr = transaction._id.toString();

    // 2. Generate Skrill checkout form parameters
    const checkoutData = this.skrillService.generateCheckoutData({
      transactionId: transactionIdStr,
      amount: dto.amount,
      currency: dto.currency,
      customerEmail: dto.customerEmail,
      description: `${dto.productType.toUpperCase()} Order`,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
    });

    transaction.gatewayOrderId = transactionIdStr;
    await transaction.save();

    return {
      message: 'Skrill payment session initiated successfully',
      data: {
        transactionId: transaction._id,
        checkoutUrl: checkoutData.checkoutUrl,
        formFields: checkoutData.formFields,
        status: transaction.status,
      },
    };
  }

  async handleSkrillIpn(dto: SkrillIpnDto) {
    this.logger.log(
      `Received Skrill IPN callback for transaction: ${dto.transaction_id}`,
    );

    const isValid = this.skrillService.verifyIpnSignature({
      merchant_id: dto.merchant_id,
      transaction_id: dto.transaction_id,
      mb_amount: dto.mb_amount,
      mb_currency: dto.mb_currency,
      status: dto.status,
      md5sig: dto.md5sig,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid Skrill IPN signature');
    }

    const query = Types.ObjectId.isValid(dto.transaction_id)
      ? { _id: dto.transaction_id }
      : { gatewayOrderId: dto.transaction_id };

    const transaction = await this.transactionModel.findOne(query);
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID '${dto.transaction_id}' not found`,
      );
    }

    transaction.gatewayTransactionId =
      dto.mb_transaction_id || transaction.gatewayTransactionId;
    transaction.gatewayRawResponse = dto;

    // Skrill status codes: '2' = processed (completed), '0' = pending, '-1' = cancelled, '-2' = failed
    switch (dto.status) {
      case '2':
        transaction.status = PaymentStatus.COMPLETED;
        break;
      case '0':
        transaction.status = PaymentStatus.PENDING;
        break;
      case '-1':
        transaction.status = PaymentStatus.CANCELLED;
        break;
      case '-2':
      case '-3':
        transaction.status = PaymentStatus.FAILED;
        break;
      default:
        this.logger.warn(`Unknown Skrill status code received: ${dto.status}`);
        break;
    }

    await transaction.save();

    return {
      message: 'Skrill IPN processed successfully',
      status: transaction.status,
    };
  }

  // ─── Transaction Queries ─────────────────────────────────────────────────────
  async getAllTransactions(query: QueryTransactionDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.gateway) filter.gateway = query.gateway;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { customerEmail: { $regex: query.search, $options: 'i' } },
        { gatewayOrderId: { $regex: query.search, $options: 'i' } },
        { gatewayTransactionId: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('userId', 'email first_name last_name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.transactionModel.countDocuments(filter),
    ]);

    return {
      message: 'Retrieved transactions successfully',
      pagination: createPaginationInfo(page, limit, total),
      data: transactions,
    };
  }

  async getUserTransactions(userId: string, query: QueryTransactionDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };
    if (query.gateway) filter.gateway = query.gateway;
    if (query.status) filter.status = query.status;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.transactionModel.countDocuments(filter),
    ]);

    return {
      message: 'Retrieved user transactions successfully',
      pagination: createPaginationInfo(page, limit, total),
      data: transactions,
    };
  }

  async getTransactionById(id: string) {
    const query = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { gatewayOrderId: id };

    const transaction = await this.transactionModel
      .findOne(query)
      .populate('userId', 'email first_name last_name');

    if (!transaction) {
      throw new NotFoundException(`Transaction '${id}' not found`);
    }

    return {
      message: 'Retrieved transaction successfully',
      data: transaction,
    };
  }
}
