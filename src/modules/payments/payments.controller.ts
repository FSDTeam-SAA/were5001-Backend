import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  CreatePayPalOrderDto,
  CreateSkrillPaymentDto,
  SkrillIpnDto,
  QueryTransactionDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '../../common/enums/role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── PayPal Endpoints ────────────────────────────────────────────────────────
  @Post('paypal/create-order')
  createPayPalOrder(@Body() dto: CreatePayPalOrderDto, @Req() req: any) {
    // If a JWT token is passed, extract user ID optionally
    const userId = req.user?._id?.toString();
    return this.paymentsService.createPayPalOrder(dto, userId);
  }

  @Post('paypal/capture-order/:orderId')
  capturePayPalOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.capturePayPalOrder(orderId);
  }

  @Post('paypal/webhook')
  handlePayPalWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ) {
    return this.paymentsService.handlePayPalWebhook(headers, body);
  }

  // ─── Skrill Endpoints ────────────────────────────────────────────────────────
  @Post('skrill/create-session')
  createSkrillPayment(@Body() dto: CreateSkrillPaymentDto, @Req() req: any) {
    const userId = req.user?._id?.toString();
    return this.paymentsService.createSkrillPayment(dto, userId);
  }

  @Post('skrill/ipn')
  handleSkrillIpn(@Body() dto: SkrillIpnDto) {
    return this.paymentsService.handleSkrillIpn(dto);
  }

  // ─── Transaction Query Endpoints ─────────────────────────────────────────────
  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getAllTransactions(@Query() query: QueryTransactionDto) {
    return this.paymentsService.getAllTransactions(query);
  }

  @Get('transactions/my')
  @UseGuards(JwtAuthGuard)
  getMyTransactions(
    @CurrentUser('_id') userId: string,
    @Query() query: QueryTransactionDto,
  ) {
    return this.paymentsService.getUserTransactions(userId, query);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  getTransactionById(@Param('id') id: string) {
    return this.paymentsService.getTransactionById(id);
  }
}
