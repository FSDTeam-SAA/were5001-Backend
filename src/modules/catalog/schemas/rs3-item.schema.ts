import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type Rs3ItemDocument = HydratedDocument<Rs3Item>;

@Schema({ collection: 'rs3_items_db', timestamps: true })
export class Rs3Item {
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

export const Rs3ItemSchema = SchemaFactory.createForClass(Rs3Item);
