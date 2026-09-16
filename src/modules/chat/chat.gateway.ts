import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, forwardRef, Inject } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { ChatSenderType } from './schemas/chat-message.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to chat: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from chat: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userName?: string },
  ) {
    if (!payload.roomId) return { error: 'roomId is required' };
    client.join(payload.roomId);
    this.logger.log(`Client ${client.id} joined room ${payload.roomId}`);
    return { event: 'joined_room', roomId: payload.roomId };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    if (!payload.roomId) return;
    client.leave(payload.roomId);
    this.logger.log(`Client ${client.id} left room ${payload.roomId}`);
    return { event: 'left_room', roomId: payload.roomId };
  }

  @SubscribeMessage('admin_join')
  handleAdminJoin(@ConnectedSocket() client: Socket) {
    client.join('admin_support_channel');
    this.logger.log(`Admin client ${client.id} joined admin_support_channel`);
    return { event: 'joined_admin_channel' };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      message: SendMessageDto;
      senderId?: string;
    },
  ) {
    if (!payload.roomId || !payload.message?.content) {
      return { error: 'roomId and message content are required' };
    }

    const savedMessage = await this.chatService.saveMessage(
      payload.roomId,
      payload.message,
      payload.senderId,
    );

    // Broadcast to room members
    this.server.to(payload.roomId).emit('new_message', savedMessage);

    // If sent by customer, also alert the admin support channel
    if (savedMessage.senderType !== ChatSenderType.ADMIN) {
      this.server.to('admin_support_channel').emit('admin_new_message', {
        roomId: payload.roomId,
        message: savedMessage,
      });
    }

    return { event: 'message_sent', data: savedMessage };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userName: string; isTyping: boolean },
  ) {
    if (!payload.roomId) return;
    client.to(payload.roomId).emit('typing_status', {
      userName: payload.userName,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() payload: { roomId: string; readerType: 'admin' | 'customer' },
  ) {
    if (!payload.roomId) return;
    await this.chatService.markAsRead(payload.roomId, payload.readerType);
    this.server.to(payload.roomId).emit('messages_read', {
      roomId: payload.roomId,
      readerType: payload.readerType,
    });
    return { event: 'marked_as_read', roomId: payload.roomId };
  }

  // Server-side helper to broadcast new message from HTTP controller
  broadcastNewMessage(roomId: string, message: any) {
    if (!this.server) return;
    this.server.to(roomId).emit('new_message', message);
    if (message.senderType !== ChatSenderType.ADMIN) {
      this.server.to('admin_support_channel').emit('admin_new_message', {
        roomId,
        message,
      });
    }
  }
}
