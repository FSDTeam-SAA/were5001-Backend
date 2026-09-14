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
import { CatalogService } from './catalog.service';
import {
  CreateItemDto,
  UpdateItemDto,
  CreateSkillingDto,
  UpdateSkillingDto,
  QueryCatalogDto,
} from './dto/catalog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ─── OSRS Items ─────────────────────────────────────────────────────────────
  @Get('osrs-items')
  getAllOsrsItems(@Query() query: QueryCatalogDto) {
    return this.catalogService.getAllItems('osrs', query);
  }

  @Get('osrs-items/:id')
  getOsrsItemById(@Param('id') id: string) {
    return this.catalogService.getItemById('osrs', id);
  }

  @Post('osrs-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createOsrsItem(@Body() dto: CreateItemDto) {
    return this.catalogService.createItem('osrs', dto);
  }

  @Put('osrs-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateOsrsItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.catalogService.updateItem('osrs', id, dto);
  }

  @Delete('osrs-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteOsrsItem(@Param('id') id: string) {
    return this.catalogService.deleteItem('osrs', id);
  }

  // ─── RS3 Items ──────────────────────────────────────────────────────────────
  @Get('rs3-items')
  getAllRs3Items(@Query() query: QueryCatalogDto) {
    return this.catalogService.getAllItems('rs3', query);
  }

  @Get('rs3-items/:id')
  getRs3ItemById(@Param('id') id: string) {
    return this.catalogService.getItemById('rs3', id);
  }

  @Post('rs3-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createRs3Item(@Body() dto: CreateItemDto) {
    return this.catalogService.createItem('rs3', dto);
  }

  @Put('rs3-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateRs3Item(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.catalogService.updateItem('rs3', id, dto);
  }

  @Delete('rs3-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteRs3Item(@Param('id') id: string) {
    return this.catalogService.deleteItem('rs3', id);
  }

  // ─── Skilling Services ──────────────────────────────────────────────────────
  @Get('skilling')
  getAllSkilling(@Query() query: QueryCatalogDto) {
    return this.catalogService.getAllSkilling(query);
  }

  @Get('skilling/:id')
  getSkillingById(@Param('id') id: string) {
    return this.catalogService.getSkillingById(id);
  }

  @Post('skilling')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createSkilling(@Body() dto: CreateSkillingDto) {
    return this.catalogService.createSkilling(dto);
  }

  @Put('skilling/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateSkilling(@Param('id') id: string, @Body() dto: UpdateSkillingDto) {
    return this.catalogService.updateSkilling(id, dto);
  }

  @Delete('skilling/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteSkilling(@Param('id') id: string) {
    return this.catalogService.deleteSkilling(id);
  }
}
