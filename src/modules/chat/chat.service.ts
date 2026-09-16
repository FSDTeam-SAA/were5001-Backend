import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChatConversation,
  ChatConversationDocument,
  ConversationStatus,
} from './schemas/chat-conversation.schema';
import {
  ChatMessage,
  ChatMessageDocument,
  ChatMessageType,
  ChatSenderType,
} from './schemas/chat-message.schema';
import {
  InitConversationDto,
  PrefillOrderDto,
  SendMessageDto,
  QueryConversationDto,
  QueryMessageDto,
} from './dto/chat.dto';
import { generateFormattedOrderMessage } from './utils/chat-order-generator.util';
import { ChatGateway } from './chat.gateway';
import { createPaginationInfo } from '../../common/utils/pagination.util';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatConversation.name)
    private readonly conversationModel: Model<ChatConversationDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // ─── Initialize / Find Conversation ──────────────────────────────────────────
  async initConversation(dto: InitConversationDto, userId?: string) {
    let conversation: ChatConversationDocument | null = null;

    // 1. If explicit roomId is provided, find it
    if (dto.roomId) {
      conversation = await this.conversationModel.findOne({
        roomId: dto.roomId,
      });
    }

    // 2. Or if active conversation exists for authenticated user
    if (!conversation && userId && Types.ObjectId.isValid(userId)) {
      conversation = await this.conversationModel.findOne({
        userId: new Types.ObjectId(userId),
        status: ConversationStatus.ACTIVE,
      });
    }

    // 3. Or if active conversation exists for guest token
    if (!conversation && dto.guestId) {
      conversation = await this.conversationModel.findOne({
        guestId: dto.guestId,
        status: ConversationStatus.ACTIVE,
      });
    }

    // 4. If still not found, create new conversation
    if (!conversation) {
      const roomId = dto.roomId || this.generateRoomId();
      conversation = await this.conversationModel.create({
        roomId,
        userId:
          userId && Types.ObjectId.isValid(userId)
            ? new Types.ObjectId(userId)
            : undefined,
        guestId: dto.guestId,
        customerName: dto.customerName || 'Guest Visitor',
        customerEmail: dto.customerEmail,
        orderContext: dto.orderContext || null,
        status: ConversationStatus.ACTIVE,
      });
    }

    return {
      message: 'Conversation initialized successfully',
      data: conversation,
    };
  }

  // ─── Automated Order Pre-fills System ────────────────────────────────────────
  async prefillOrder(dto: PrefillOrderDto, userId?: string) {
    // 1. Generate clean formatted message and title
    const { formattedSummary, displayTitle } =
      generateFormattedOrderMessage(dto);

    // 2. Find or create active conversation
    let conversation: ChatConversationDocument | null = null;
    if (dto.roomId) {
      conversation = await this.conversationModel.findOne({
        roomId: dto.roomId,
      });
    }

    if (!conversation && userId && Types.ObjectId.isValid(userId)) {
      conversation = await this.conversationModel.findOne({
        userId: new Types.ObjectId(userId),
        status: ConversationStatus.ACTIVE,
      });
    }

    if (!conversation && dto.guestId) {
      conversation = await this.conversationModel.findOne({
        guestId: dto.guestId,
        status: ConversationStatus.ACTIVE,
      });
    }

    const roomId = conversation ? conversation.roomId : this.generateRoomId();

    if (!conversation) {
      conversation = await this.conversationModel.create({
        roomId,
        userId:
          userId && Types.ObjectId.isValid(userId)
            ? new Types.ObjectId(userId)
            : undefined,
        guestId: dto.guestId,
        customerName: dto.customerName || 'Customer',
        customerEmail: dto.customerEmail,
        orderContext: {
          ...dto,
          formattedSummary,
          displayTitle,
        },
        status: ConversationStatus.ACTIVE,
      });
    } else {
      conversation.orderContext = {
        ...dto,
        formattedSummary,
        displayTitle,
      };
      if (dto.customerName) conversation.customerName = dto.customerName;
      if (dto.customerEmail) conversation.customerEmail = dto.customerEmail;
      await conversation.save();
    }

    // 3. Create the initial Order Pre-fill message
    const message = await this.messageModel.create({
      conversationId: conversation._id,
      roomId,
      senderType: ChatSenderType.CUSTOMER,
      senderId: userId || dto.guestId || 'guest',
      senderName: dto.customerName || conversation.customerName || 'Customer',
      content: formattedSummary,
      messageType: ChatMessageType.ORDER_PREFILL,
      metadata: {
        ...dto,
        displayTitle,
      },
      isRead: false,
    });

    // 4. Update conversation metadata & unread counters
    conversation.lastMessage = {
      content: `[Order Prefill] ${displayTitle}`,
      senderType: ChatSenderType.CUSTOMER,
      senderName: message.senderName,
      timestamp: new Date(),
    };
    conversation.unreadAdminCount += 1;
    await conversation.save();

    // 5. Broadcast to Socket.IO room and Admin notification channel
    this.chatGateway.broadcastNewMessage(roomId, message);

    return {
      message: 'Order prefill generated and chat session active',
      data: {
        conversation,
        orderMessage: message,
      },
    };
  }

  // ─── Save & Broadcast Message ────────────────────────────────────────────────
  async saveMessage(
    roomId: string,
    dto: SendMessageDto,
    senderId?: string,
  ) {
    const conversation = await this.conversationModel.findOne({ roomId });
    if (!conversation) {
      throw new NotFoundException(`Chat room '${roomId}' not found`);
    }

    const senderType = dto.senderType || ChatSenderType.CUSTOMER;

    const message = await this.messageModel.create({
      conversationId: conversation._id,
      roomId,
      senderType,
      senderId: senderId || (conversation.userId ? conversation.userId.toString() : 'guest'),
      senderName: dto.senderName || (senderType === ChatSenderType.ADMIN ? 'Support Agent' : conversation.customerName),
      content: dto.content,
      messageType: dto.messageType || ChatMessageType.TEXT,
      metadata: dto.metadata || null,
      isRead: false,
    });

    // Update conversation lastMessage & unread count
    conversation.lastMessage = {
      content: dto.content,
      senderType,
      senderName: message.senderName,
      timestamp: new Date(),
    };

    if (senderType === ChatSenderType.ADMIN) {
      conversation.unreadCustomerCount += 1;
    } else {
      conversation.unreadAdminCount += 1;
    }

    if (conversation.status === ConversationStatus.CLOSED) {
      conversation.status = ConversationStatus.ACTIVE;
    }

    await conversation.save();

    return message;
  }

  // ─── Query Messages ──────────────────────────────────────────────────────────
  async getMessages(roomId: string, query: QueryMessageDto) {
    const conversation = await this.conversationModel.findOne({ roomId });
    if (!conversation) {
      throw new NotFoundException(`Chat room '${roomId}' not found`);
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ roomId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      this.messageModel.countDocuments({ roomId }),
    ]);

    return {
      message: 'Retrieved chat messages successfully',
      conversation,
      pagination: createPaginationInfo(page, limit, total),
      data: messages,
    };
  }

  // ─── Query Conversations ─────────────────────────────────────────────────────
  async getAllConversations(query: QueryConversationDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 15;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { customerName: { $regex: query.search, $options: 'i' } },
        { customerEmail: { $regex: query.search, $options: 'i' } },
        { roomId: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      this.conversationModel.countDocuments(filter),
    ]);

    return {
      message: 'Retrieved conversations successfully',
      pagination: createPaginationInfo(page, limit, total),
      data: conversations,
    };
  }

  async getUserConversations(userId: string, query: QueryConversationDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 15;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };
    if (query.status) filter.status = query.status;

    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      this.conversationModel.countDocuments(filter),
    ]);

    return {
      message: 'Retrieved user conversations successfully',
      pagination: createPaginationInfo(page, limit, total),
      data: conversations,
    };
  }

  async getConversationByRoomId(roomId: string) {
    const conversation = await this.conversationModel
      .findOne({ roomId })
      .populate('userId', 'name email');

    if (!conversation) {
      throw new NotFoundException(`Conversation '${roomId}' not found`);
    }

    return {
      message: 'Retrieved conversation details',
      data: conversation,
    };
  }

  async closeConversation(roomId: string) {
    const conversation = await this.conversationModel.findOne({ roomId });
    if (!conversation) {
      throw new NotFoundException(`Conversation '${roomId}' not found`);
    }

    conversation.status = ConversationStatus.CLOSED;
    await conversation.save();

    return {
      message: 'Conversation closed successfully',
      data: conversation,
    };
  }

  async markAsRead(roomId: string, readerType: 'admin' | 'customer') {
    const conversation = await this.conversationModel.findOne({ roomId });
    if (!conversation) return;

    if (readerType === 'admin') {
      conversation.unreadAdminCount = 0;
      await this.messageModel.updateMany(
        { roomId, senderType: { $ne: ChatSenderType.ADMIN }, isRead: false },
        { $set: { isRead: true } },
      );
    } else {
      conversation.unreadCustomerCount = 0;
      await this.messageModel.updateMany(
        { roomId, senderType: ChatSenderType.ADMIN, isRead: false },
        { $set: { isRead: true } },
      );
    }

    await conversation.save();
  }
}
