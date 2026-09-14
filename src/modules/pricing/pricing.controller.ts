import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import {
  CreateValuteDto,
  UpdateValuteDto,
  QueryValuteDto,
  UpdateBasePriceDto,
  CreatePaymentGatewayDto,
  UpdatePaymentGatewayDto,
} from './dto/pricing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // ─── Valutes Endpoints ──────────────────────────────────────────────────────
  @Get('valutes')
  getAllValutes(@Query() query: QueryValuteDto) {
    return this.pricingService.getAllValutes(query);
  }

  @Get('valutes/:id')
  getValuteById(@Param('id') id: string) {
    return this.pricingService.getValuteById(id);
  }

  @Post('valutes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createValute(@Body() dto: CreateValuteDto) {
    return this.pricingService.createValute(dto);
  }

  @Put('valutes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateValute(@Param('id') id: string, @Body() dto: UpdateValuteDto) {
    return this.pricingService.updateValute(id, dto);
  }

  @Delete('valutes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteValute(@Param('id') id: string) {
    return this.pricingService.deleteValute(id);
  }

  // ─── Base Price (items_price) ──────────────────────────────────────────────
  @Get('base-price')
  getBasePrice() {
    return this.pricingService.getBasePrice();
  }

  @Put('base-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateBasePrice(@Body() dto: UpdateBasePriceDto) {
    return this.pricingService.updateBasePrice(dto);
  }

  @Get('gold-rate')
  calculateGoldRate(
    @Query('game') game: 'osrs' | 'rs3' = 'osrs',
    @Query('valuteId') valuteId?: string,
  ) {
    return this.pricingService.calculateGoldRate(game, valuteId);
  }

  // ─── Payment Gateway Settings (payments_db) ─────────────────────────────────
  @Get('payments')
  getAllPaymentGateways() {
    return this.pricingService.getAllPaymentGateways();
  }

  @Get('payments/:id')
  getPaymentGatewayById(@Param('id') id: string) {
    return this.pricingService.getPaymentGatewayById(id);
  }

  @Post('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createPaymentGateway(@Body() dto: CreatePaymentGatewayDto) {
    return this.pricingService.createPaymentGateway(dto);
  }

  @Put('payments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updatePaymentGateway(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentGatewayDto,
  ) {
    return this.pricingService.updatePaymentGateway(id, dto);
  }

  @Delete('payments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deletePaymentGateway(@Param('id') id: string) {
    return this.pricingService.deletePaymentGateway(id);
  }
}
