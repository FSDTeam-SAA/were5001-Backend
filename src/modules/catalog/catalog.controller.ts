import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CatalogService } from './catalog.service';
import {
  CreateItemDto,
  UpdateItemDto,
  CreateSkillingDto,
  UpdateSkillingDto,
  UpdateSkillingMethodsDto,
  PatchStockDto,
  PatchVisibilityDto,
  QueryCatalogDto,
} from './dto/catalog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';
import { createDiskStorage } from '../../common/utils/multer.util';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async resolveImage(
    file?: Express.Multer.File,
    existingImage?: string,
  ): Promise<string | undefined> {
    if (file) {
      try {
        const uploadRes = await this.cloudinaryService.upload(
          file.path,
          file.filename,
          'catalog',
        );
        return uploadRes.url;
      } catch {
        return `/uploads/images/${file.filename}`;
      }
    }
    return existingImage;
  }

  // ─── OSRS Items CRUD ────────────────────────────────────────────────────────
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
  @UseInterceptors(
    FileInterceptor('image', { storage: createDiskStorage('images') }),
  )
  async createOsrsItem(
    @Body() dto: CreateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = await this.resolveImage(file, dto.image);
    if (!imageUrl) {
      throw new BadRequestException('Image file or image URL is required');
    }
    dto.image = imageUrl;
    return this.catalogService.createItem('osrs', dto);
  }

  @Put('osrs-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', { storage: createDiskStorage('images') }),
  )
  async updateOsrsItem(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = await this.resolveImage(file, dto.image);
    if (imageUrl) dto.image = imageUrl;
    return this.catalogService.updateItem('osrs', id, dto);
  }

  @Patch('osrs-items/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  setOsrsStock(@Param('id') id: string, @Body() body: PatchStockDto) {
    return this.catalogService.setItemStock('osrs', id, body.inStock);
  }

  @Patch('osrs-items/:id/toggle-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  toggleOsrsStock(@Param('id') id: string) {
    return this.catalogService.toggleItemStock('osrs', id);
  }

  @Patch('osrs-items/:id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  setOsrsVisibility(@Param('id') id: string, @Body() body: PatchVisibilityDto) {
    return this.catalogService.setItemVisibility('osrs', id, body.visible);
  }

  @Patch('osrs-items/:id/toggle-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  toggleOsrsVisibility(@Param('id') id: string) {
    return this.catalogService.toggleItemVisibility('osrs', id);
  }

  @Delete('osrs-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteOsrsItem(@Param('id') id: string) {
    return this.catalogService.deleteItem('osrs', id);
  }

  // ─── RS3 Items CRUD ─────────────────────────────────────────────────────────
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
  @UseInterceptors(
    FileInterceptor('image', { storage: createDiskStorage('images') }),
  )
  async createRs3Item(
    @Body() dto: CreateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = await this.resolveImage(file, dto.image);
    if (!imageUrl) {
      throw new BadRequestException('Image file or image URL is required');
    }
    dto.image = imageUrl;
    return this.catalogService.createItem('rs3', dto);
  }

  @Put('rs3-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', { storage: createDiskStorage('images') }),
  )
  async updateRs3Item(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = await this.resolveImage(file, dto.image);
    if (imageUrl) dto.image = imageUrl;
    return this.catalogService.updateItem('rs3', id, dto);
  }

  @Patch('rs3-items/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  setRs3Stock(@Param('id') id: string, @Body() body: PatchStockDto) {
    return this.catalogService.setItemStock('rs3', id, body.inStock);
  }

  @Patch('rs3-items/:id/toggle-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  toggleRs3Stock(@Param('id') id: string) {
    return this.catalogService.toggleItemStock('rs3', id);
  }

  @Patch('rs3-items/:id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  setRs3Visibility(@Param('id') id: string, @Body() body: PatchVisibilityDto) {
    return this.catalogService.setItemVisibility('rs3', id, body.visible);
  }

  @Patch('rs3-items/:id/toggle-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  toggleRs3Visibility(@Param('id') id: string) {
    return this.catalogService.toggleItemVisibility('rs3', id);
  }

  @Delete('rs3-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteRs3Item(@Param('id') id: string) {
    return this.catalogService.deleteItem('rs3', id);
  }

  // ─── Skilling Services CRUD ─────────────────────────────────────────────────
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
  @UseInterceptors(
    FileInterceptor('image', { storage: createDiskStorage('images') }),
  )
  async createSkilling(
    @Body() dto: CreateSkillingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = await this.resolveImage(file, dto.image);
    if (!imageUrl) {
      throw new BadRequestException('Image file or image URL is required');
    }
    dto.image = imageUrl;

    if (typeof dto.methods === 'string') {
      try {
        dto.methods = JSON.parse(dto.methods) as Record<string, any>;
      } catch {
        throw new BadRequestException('methods must be a valid JSON object');
      }
    }
    return this.catalogService.createSkilling(dto);
  }

  @Put('skilling/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', { storage: createDiskStorage('images') }),
  )
  async updateSkilling(
    @Param('id') id: string,
    @Body() dto: UpdateSkillingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = await this.resolveImage(file, dto.image);
    if (imageUrl) dto.image = imageUrl;

    if (typeof dto.methods === 'string') {
      try {
        dto.methods = JSON.parse(dto.methods) as Record<string, any>;
      } catch {
        throw new BadRequestException('methods must be a valid JSON object');
      }
    }
    return this.catalogService.updateSkilling(id, dto);
  }

  @Patch('skilling/:id/methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateSkillingMethods(
    @Param('id') id: string,
    @Body() body: UpdateSkillingMethodsDto,
  ) {
    return this.catalogService.updateSkillingMethods(id, body.methods);
  }

  @Patch('skilling/:id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  setSkillingVisibility(
    @Param('id') id: string,
    @Body() body: PatchVisibilityDto,
  ) {
    return this.catalogService.setSkillingVisibility(id, body.visible);
  }

  @Patch('skilling/:id/toggle-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  toggleSkillingVisibility(@Param('id') id: string) {
    return this.catalogService.toggleSkillingVisibility(id);
  }

  @Delete('skilling/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteSkilling(@Param('id') id: string) {
    return this.catalogService.deleteSkilling(id);
  }
}
