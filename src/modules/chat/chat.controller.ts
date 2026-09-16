import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  InitConversationDto,
  PrefillOrderDto,
  SendMessageDto,
  QueryConversationDto,
  QueryMessageDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '../../common/enums/role.enum';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ─── Automated Order Pre-fills Endpoint ───────────────────────────────────────
  @Post('prefill-order')
  prefillOrder(@Body() dto: PrefillOrderDto, @Req() req: any) {
    const userId = req.user?._id?.toString();
    return this.chatService.prefillOrder(dto, userId);
  }

  // ─── Initialize / Find Active Conversation ──────────────────────────────────
  @Post('conversations/init')
  initConversation(@Body() dto: InitConversationDto, @Req() req: any) {
    const userId = req.user?._id?.toString();
    return this.chatService.initConversation(dto, userId);
  }

  // ─── Admin: List All Customer Conversations ──────────────────────────────────
  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getAllConversations(@Query() query: QueryConversationDto) {
    return this.chatService.getAllConversations(query);
  }

  // ─── User: List My Conversations ─────────────────────────────────────────────
  @Get('conversations/my')
  @UseGuards(JwtAuthGuard)
  getMyConversations(
    @CurrentUser('_id') userId: string,
    @Query() query: QueryConversationDto,
  ) {
    return this.chatService.getUserConversations(userId, query);
  }

  // ─── Get Conversation Details & Messages ─────────────────────────────────────
  @Get('conversations/:roomId')
  async getConversationMessages(
    @Param('roomId') roomId: string,
    @Query() query: QueryMessageDto,
  ) {
    return this.chatService.getMessages(roomId, query);
  }

  // ─── Send Message via HTTP Fallback ──────────────────────────────────────────
  @Post('conversations/:roomId/messages')
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    const senderId = req.user?._id?.toString();
    const message = await this.chatService.saveMessage(roomId, dto, senderId);
    this.chatGateway.broadcastNewMessage(roomId, message);
    return {
      message: 'Message sent successfully',
      data: message,
    };
  }

  // ─── Close Conversation ──────────────────────────────────────────────────────
  @Patch('conversations/:roomId/close')
  closeConversation(@Param('roomId') roomId: string) {
    return this.chatService.closeConversation(roomId);
  }

  // ─── Mark Messages as Read ───────────────────────────────────────────────────
  @Patch('conversations/:roomId/read')
  async markAsRead(
    @Param('roomId') roomId: string,
    @Body('readerType') readerType: 'admin' | 'customer' = 'admin',
  ) {
    await this.chatService.markAsRead(roomId, readerType);
    return {
      message: 'Messages marked as read',
      roomId,
      readerType,
    };
  }
}
