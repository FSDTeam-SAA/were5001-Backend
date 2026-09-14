import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OsrsItemDocument = HydratedDocument<OsrsItem>;

@Schema({ collection: 'osrs_items_db', timestamps: true })
export class OsrsItem {
  @Prop({ required: true, index: true, trim: true, maxlength: 64 })
  item_id: string;

  @Prop({ required: true, trim: true, maxlength: 64 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 256 })
  image: string;

  @Prop({ required: true, type: Boolean, default: true })
  inStock: boolean;

  @Prop({ required: true, type: Boolean, default: true })
  visible: boolean;
}

export const OsrsItemSchema = SchemaFactory.createForClass(OsrsItem);
