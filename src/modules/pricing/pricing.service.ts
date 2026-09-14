import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Valute, ValuteDocument } from './schemas/valute.schema';
import { ItemsPrice, ItemsPriceDocument } from './schemas/items-price.schema';
import {
  PaymentGateway,
  PaymentGatewayDocument,
} from './schemas/payment.schema';
import {
  CreateValuteDto,
  UpdateValuteDto,
  QueryValuteDto,
  UpdateBasePriceDto,
  CreatePaymentGatewayDto,
  UpdatePaymentGatewayDto,
} from './dto/pricing.dto';
import { createPaginationInfo } from '../../common/utils/pagination.util';

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(Valute.name)
    private readonly valuteModel: Model<ValuteDocument>,
    @InjectModel(ItemsPrice.name)
    private readonly itemsPriceModel: Model<ItemsPriceDocument>,
    @InjectModel(PaymentGateway.name)
    private readonly paymentGatewayModel: Model<PaymentGatewayDocument>,
  ) {}

  // ─── Valutes (Currencies) ───────────────────────────────────────────────────
  async createValute(dto: CreateValuteDto) {
    const existing = await this.valuteModel.findOne({
      $or: [{ real_id: dto.real_id }, { image: dto.image }],
    });
    if (existing) {
      throw new BadRequestException(
        `Valute with real_id '${dto.real_id}' or image '${dto.image}' already exists`,
      );
    }
    const valute = await this.valuteModel.create(dto);
    return {
      message: 'Valute created successfully',
      data: valute,
    };
  }

  async getAllValutes(query: QueryValuteDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { real_id: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [valutes, total] = await Promise.all([
      this.valuteModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.valuteModel.countDocuments(filter),
    ]);

    return {
      message: 'Retrieved valutes successfully',
      pagination: createPaginationInfo(page, limit, total),
      data: valutes,
    };
  }

  async getValuteById(id: string) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { real_id: id };
    const valute = await this.valuteModel.findOne(query);
    if (!valute) {
      throw new NotFoundException(`Valute with identifier '${id}' not found`);
    }
    return {
      message: 'Retrieved valute successfully',
      data: valute,
    };
  }

  async updateValute(id: string, dto: UpdateValuteDto) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { real_id: id };
    const updated = await this.valuteModel.findOneAndUpdate(query, dto, {
      new: true,
    });
    if (!updated) {
      throw new NotFoundException(`Valute with identifier '${id}' not found`);
    }
    return {
      message: 'Valute updated successfully',
      data: updated,
    };
  }

  async deleteValute(id: string) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { real_id: id };
    const result = await this.valuteModel.deleteOne(query);
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Valute with identifier '${id}' not found`);
    }
    return {
      message: 'Valute deleted successfully',
    };
  }

  // ─── Base Price (items_price) ──────────────────────────────────────────────
  async getBasePrice(): Promise<ItemsPriceDocument> {
    let price = await this.itemsPriceModel.findOne();
    if (!price) {
      price = await this.itemsPriceModel.create({ osrs: 1.8, rs3: 20.0 });
    }
    return price;
  }

  async updateBasePrice(dto: UpdateBasePriceDto) {
    let price = await this.itemsPriceModel.findOne();
    if (!price) {
      price = await this.itemsPriceModel.create({
        osrs: dto.osrs ?? 1.8,
        rs3: dto.rs3 ?? 20.0,
      });
    } else {
      if (dto.osrs !== undefined) price.osrs = dto.osrs;
      if (dto.rs3 !== undefined) price.rs3 = dto.rs3;
      await price.save();
    }
    return {
      message: 'Base price updated successfully',
      data: price,
    };
  }

  // Applies gold rate from base_price to currency conversion
  async calculateGoldRate(game: 'osrs' | 'rs3', valuteId?: string) {
    const basePrice = await this.getBasePrice();
    const rate = game === 'osrs' ? basePrice.osrs : basePrice.rs3;

    let currency: ValuteDocument | null = null;
    if (valuteId) {
      const query = valuteId.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: valuteId }
        : { real_id: valuteId };
      currency = await this.valuteModel.findOne(query);
    }

    const buyMultiplier = currency
      ? game === 'osrs'
        ? currency.osrs_buy
        : currency.rs3_buy
      : 1;
    const sellMultiplier = currency
      ? game === 'osrs'
        ? currency.osrs_sell
        : currency.rs3_sell
      : 1;

    return {
      game,
      baseRate: rate,
      currency: currency ? currency.real_id : 'USD_BASE',
      buyPricePerUnit: rate * (buyMultiplier || 1),
      sellPricePerUnit: rate * (sellMultiplier || 1),
    };
  }

  // ─── Payment Gateway Settings (payments_db) ─────────────────────────────────
  async createPaymentGateway(dto: CreatePaymentGatewayDto) {
    const payload: Partial<PaymentGateway> = {
      osrs_buy: dto.osrs_buy ?? {},
      osrs_sell: dto.osrs_sell ?? {},
      rs3_buy: dto.rs3_buy ?? {},
      rs3_sell: dto.rs3_sell ?? {},
    };
    if (dto.valuteId && Types.ObjectId.isValid(dto.valuteId)) {
      payload.valuteId = new Types.ObjectId(dto.valuteId);
    }
    const gateway = await this.paymentGatewayModel.create(payload);
    return {
      message: 'Payment gateway configuration created successfully',
      data: gateway,
    };
  }

  async getAllPaymentGateways() {
    const gateways = await this.paymentGatewayModel.find().populate('valuteId');
    return {
      message: 'Payment gateway configurations retrieved successfully',
      data: gateways,
    };
  }

  async getPaymentGatewayById(id: string) {
    const gateway = await this.paymentGatewayModel
      .findById(id)
      .populate('valuteId');
    if (!gateway) {
      throw new NotFoundException(
        `Payment gateway configuration '${id}' not found`,
      );
    }
    return {
      message: 'Payment gateway configuration retrieved successfully',
      data: gateway,
    };
  }

  async updatePaymentGateway(id: string, dto: UpdatePaymentGatewayDto) {
    const payload: Partial<PaymentGateway> = {};
    if (dto.osrs_buy !== undefined) payload.osrs_buy = dto.osrs_buy;
    if (dto.osrs_sell !== undefined) payload.osrs_sell = dto.osrs_sell;
    if (dto.rs3_buy !== undefined) payload.rs3_buy = dto.rs3_buy;
    if (dto.rs3_sell !== undefined) payload.rs3_sell = dto.rs3_sell;
    if (dto.valuteId && Types.ObjectId.isValid(dto.valuteId)) {
      payload.valuteId = new Types.ObjectId(dto.valuteId);
    }

    const updated = await this.paymentGatewayModel.findByIdAndUpdate(
      id,
      payload,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException(
        `Payment gateway configuration '${id}' not found`,
      );
    }
    return {
      message: 'Payment gateway configuration updated successfully',
      data: updated,
    };
  }

  async deletePaymentGateway(id: string) {
    const result = await this.paymentGatewayModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(
        `Payment gateway configuration '${id}' not found`,
      );
    }
    return {
      message: 'Payment gateway configuration deleted successfully',
    };
  }
}
