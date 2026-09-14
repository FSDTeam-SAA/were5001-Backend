import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SkillingDocument = HydratedDocument<Skilling>;

@Schema({ collection: 'skilling_db', timestamps: true })
export class Skilling {
  @Prop({ required: true, index: true, trim: true, maxlength: 64 })
  item_id: string;

  @Prop({ required: true, trim: true, maxlength: 64 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 256 })
  image: string;

  @Prop({ type: Object, default: () => ({}) })
  methods: Record<string, any>;

  @Prop({ required: true, type: Boolean, default: true })
  visible: boolean;
}

export const SkillingSchema = SchemaFactory.createForClass(Skilling);
