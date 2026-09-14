import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<SessionDocument> {
    const payload: Partial<Session> = {
      session_id: dto.session_id,
      data: dto.data ?? {},
      expiry: dto.expiry ? new Date(dto.expiry) : undefined,
    };
    if (dto.userId && Types.ObjectId.isValid(dto.userId)) {
      payload.userId = new Types.ObjectId(dto.userId);
    }
    return this.sessionModel.create(payload);
  }

  async getSessionBySessionId(sessionId: string): Promise<SessionDocument> {
    const session = await this.sessionModel
      .findOne({ session_id: sessionId })
      .populate('userId', 'name email username role admin banned verify');
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  async getSessionsByUser(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  async updateSession(
    sessionId: string,
    dto: UpdateSessionDto,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findOneAndUpdate(
      { session_id: sessionId },
      {
        ...(dto.data !== undefined && { data: dto.data }),
        ...(dto.expiry !== undefined && { expiry: new Date(dto.expiry) }),
      },
      { new: true },
    );
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  async deleteSession(sessionId: string): Promise<{ message: string }> {
    const result = await this.sessionModel.deleteOne({ session_id: sessionId });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return { message: 'Session deleted successfully' };
  }
}
