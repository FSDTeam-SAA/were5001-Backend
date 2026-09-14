import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type Rs3AccountDocument = HydratedDocument<Rs3Account>;

@Schema({ collection: 'rs3_accounts_db', timestamps: true })
export class Rs3Account {
  @Prop({ required: true, index: true, trim: true, maxlength: 30 })
  acc_id: string;

  @Prop({ required: true, trim: true, maxlength: 30 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 1024 })
  description: string;

  @Prop({ required: true, trim: true, maxlength: 256 })
  image: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, type: Number, default: 0 })
  stock: number;
}

export const Rs3AccountSchema = SchemaFactory.createForClass(Rs3Account);
