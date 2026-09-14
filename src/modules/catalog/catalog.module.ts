import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OsrsItem, OsrsItemSchema } from './schemas/osrs-item.schema';
import { Rs3Item, Rs3ItemSchema } from './schemas/rs3-item.schema';
import { Skilling, SkillingSchema } from './schemas/skilling.schema';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OsrsItem.name, schema: OsrsItemSchema },
      { name: Rs3Item.name, schema: Rs3ItemSchema },
      { name: Skilling.name, schema: SkillingSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService, MongooseModule],
})
export class CatalogModule {}
