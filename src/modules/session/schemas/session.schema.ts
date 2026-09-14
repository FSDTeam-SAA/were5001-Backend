import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  @Prop({ required: true, unique: true, index: true, trim: true })
  session_id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ type: Object, default: () => ({}) })
  data?: Record<string, any>;

  @Prop({ type: Date, required: false, index: { expires: '0s' } })
  expiry?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
