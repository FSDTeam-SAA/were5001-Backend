import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OsrsItem, OsrsItemDocument } from './schemas/osrs-item.schema';
import { Rs3Item, Rs3ItemDocument } from './schemas/rs3-item.schema';
import { Skilling, SkillingDocument } from './schemas/skilling.schema';
import {
  CreateItemDto,
  UpdateItemDto,
  CreateSkillingDto,
  UpdateSkillingDto,
  QueryCatalogDto,
} from './dto/catalog.dto';
import { createPaginationInfo } from '../../common/utils/pagination.util';

export type GameCatalogType = 'osrs' | 'rs3';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(OsrsItem.name)
    private readonly osrsItemModel: Model<OsrsItemDocument>,
    @InjectModel(Rs3Item.name)
    private readonly rs3ItemModel: Model<Rs3ItemDocument>,
    @InjectModel(Skilling.name)
    private readonly skillingModel: Model<SkillingDocument>,
  ) {}

  private getItemModel(
    game: GameCatalogType,
  ): Model<OsrsItemDocument | Rs3ItemDocument> {
    return game === 'osrs' ? this.osrsItemModel : this.rs3ItemModel;
  }

  // ─── Items (OSRS & RS3) ─────────────────────────────────────────────────────
  async createItem(game: GameCatalogType, dto: CreateItemDto) {
    const model = this.getItemModel(game);
    const existing = await model.findOne({ item_id: dto.item_id });
    if (existing) {
      throw new BadRequestException(
        `Item with item_id '${dto.item_id}' already exists in ${game.toUpperCase()}`,
      );
    }
    const item = await model.create(dto);
    return {
      message: `${game.toUpperCase()} item created successfully`,
      data: item,
    };
  }

  async getAllItems(
    game: GameCatalogType,
    query: QueryCatalogDto,
    onlyVisible = false,
  ) {
    const model = this.getItemModel(game);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (onlyVisible) filter.visible = true;
    if (query.visible !== undefined) filter.visible = query.visible;
    if (query.inStock !== undefined) filter.inStock = query.inStock;

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { item_id: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      model.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      model.countDocuments(filter),
    ]);

    return {
      message: `Retrieved ${game.toUpperCase()} items successfully`,
      pagination: createPaginationInfo(page, limit, total),
      data: items,
    };
  }

  async getItemById(game: GameCatalogType, id: string) {
    const model = this.getItemModel(game);
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { item_id: id };
    const item = await model.findOne(query);
    if (!item) {
      throw new NotFoundException(
        `Item with identifier '${id}' not found in ${game.toUpperCase()}`,
      );
    }
    return {
      message: `Retrieved ${game.toUpperCase()} item successfully`,
      data: item,
    };
  }

  async updateItem(game: GameCatalogType, id: string, dto: UpdateItemDto) {
    const model = this.getItemModel(game);
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { item_id: id };
    const updated = await model.findOneAndUpdate(query, dto, { new: true });
    if (!updated) {
      throw new NotFoundException(
        `Item with identifier '${id}' not found in ${game.toUpperCase()}`,
      );
    }
    return {
      message: `${game.toUpperCase()} item updated successfully`,
      data: updated,
    };
  }

  async deleteItem(game: GameCatalogType, id: string) {
    const model = this.getItemModel(game);
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { item_id: id };
    const result = await model.deleteOne(query);
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Item with identifier '${id}' not found in ${game.toUpperCase()}`,
      );
    }
    return {
      message: `${game.toUpperCase()} item deleted successfully`,
    };
  }

  // ─── Skilling Services ──────────────────────────────────────────────────────
  async createSkilling(dto: CreateSkillingDto) {
    const existing = await this.skillingModel.findOne({ item_id: dto.item_id });
    if (existing) {
      throw new BadRequestException(
        `Skilling service with item_id '${dto.item_id}' already exists`,
      );
    }
    const skilling = await this.skillingModel.create(dto);
    return {
      message: 'Skilling service created successfully',
      data: skilling,
    };
  }

  async getAllSkilling(query: QueryCatalogDto, onlyVisible = false) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (onlyVisible) filter.visible = true;
    if (query.visible !== undefined) filter.visible = query.visible;

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { item_id: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [skillings, total] = await Promise.all([
      this.skillingModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.skillingModel.countDocuments(filter),
    ]);

    return {
      message: 'Retrieved skilling services successfully',
      pagination: createPaginationInfo(page, limit, total),
      data: skillings,
    };
  }

  async getSkillingById(id: string) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { item_id: id };
    const skilling = await this.skillingModel.findOne(query);
    if (!skilling) {
      throw new NotFoundException(
        `Skilling service with identifier '${id}' not found`,
      );
    }
    return {
      message: 'Retrieved skilling service successfully',
      data: skilling,
    };
  }

  async updateSkilling(id: string, dto: UpdateSkillingDto) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { item_id: id };
    const updated = await this.skillingModel.findOneAndUpdate(query, dto, {
      new: true,
    });
    if (!updated) {
      throw new NotFoundException(
        `Skilling service with identifier '${id}' not found`,
      );
    }
    return {
      message: 'Skilling service updated successfully',
      data: updated,
    };
  }

  async deleteSkilling(id: string) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { item_id: id };
    const result = await this.skillingModel.deleteOne(query);
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Skilling service with identifier '${id}' not found`,
      );
    }
    return {
      message: 'Skilling service deleted successfully',
    };
  }
}
