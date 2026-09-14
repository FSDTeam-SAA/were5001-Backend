import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OsrsAccount,
  OsrsAccountDocument,
} from './schemas/osrs-account.schema';
import { Rs3Account, Rs3AccountDocument } from './schemas/rs3-account.schema';
import {
  CreateAccountDto,
  UpdateAccountDto,
  QueryAccountDto,
} from './dto/account.dto';
import { createPaginationInfo } from '../../common/utils/pagination.util';

export type GameAccountType = 'osrs' | 'rs3';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(OsrsAccount.name)
    private readonly osrsAccountModel: Model<OsrsAccountDocument>,
    @InjectModel(Rs3Account.name)
    private readonly rs3AccountModel: Model<Rs3AccountDocument>,
  ) {}

  private getModel(
    game: GameAccountType,
  ): Model<OsrsAccountDocument | Rs3AccountDocument> {
    return game === 'osrs' ? this.osrsAccountModel : this.rs3AccountModel;
  }

  async createAccount(game: GameAccountType, dto: CreateAccountDto) {
    const model = this.getModel(game);
    const existing = await model.findOne({ acc_id: dto.acc_id });
    if (existing) {
      throw new BadRequestException(
        `Account with acc_id '${dto.acc_id}' already exists for ${game.toUpperCase()}`,
      );
    }
    const account = await model.create(dto);
    return {
      message: `${game.toUpperCase()} account created successfully`,
      data: account,
    };
  }

  async getAllAccounts(game: GameAccountType, query: QueryAccountDto) {
    const model = this.getModel(game);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { acc_id: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined)
        priceFilter.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined)
        priceFilter.$lte = Number(query.maxPrice);
      filter.price = priceFilter;
    }

    const [accounts, total] = await Promise.all([
      model.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      model.countDocuments(filter),
    ]);

    return {
      message: `Retrieved ${game.toUpperCase()} accounts successfully`,
      pagination: createPaginationInfo(page, limit, total),
      data: accounts,
    };
  }

  async getAccountById(game: GameAccountType, id: string) {
    const model = this.getModel(game);
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { acc_id: id };
    const account = await model.findOne(query);
    if (!account) {
      throw new NotFoundException(
        `Account with identifier '${id}' not found in ${game.toUpperCase()}`,
      );
    }
    return {
      message: `Retrieved ${game.toUpperCase()} account successfully`,
      data: account,
    };
  }

  async updateAccount(
    game: GameAccountType,
    id: string,
    dto: UpdateAccountDto,
  ) {
    const model = this.getModel(game);
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { acc_id: id };
    const updated = await model.findOneAndUpdate(query, dto, { new: true });
    if (!updated) {
      throw new NotFoundException(
        `Account with identifier '${id}' not found in ${game.toUpperCase()}`,
      );
    }
    return {
      message: `${game.toUpperCase()} account updated successfully`,
      data: updated,
    };
  }

  async deleteAccount(game: GameAccountType, id: string) {
    const model = this.getModel(game);
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { acc_id: id };
    const result = await model.deleteOne(query);
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Account with identifier '${id}' not found in ${game.toUpperCase()}`,
      );
    }
    return {
      message: `${game.toUpperCase()} account deleted successfully`,
    };
  }

  async adjustStock(game: GameAccountType, id: string, amount: number) {
    const model = this.getModel(game);
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { acc_id: id };
    const account = await model.findOne(query);
    if (!account) {
      throw new NotFoundException(
        `Account with identifier '${id}' not found in ${game.toUpperCase()}`,
      );
    }
    const newStock = (account.stock || 0) + amount;
    if (newStock < 0) {
      throw new BadRequestException(`Insufficient stock for account ${id}`);
    }
    account.stock = newStock;
    await account.save();
    return {
      message: `Stock updated for ${game.toUpperCase()} account`,
      data: account,
    };
  }
}
