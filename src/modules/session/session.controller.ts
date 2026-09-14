import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  createSession(@Body() dto: CreateSessionDto) {
    return this.sessionService.createSession(dto);
  }

  @Get(':sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.getSessionBySessionId(sessionId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getUserSessions(@Param('userId') userId: string) {
    return this.sessionService.getSessionsByUser(userId);
  }

  @Put(':sessionId')
  updateSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionService.updateSession(sessionId, dto);
  }

  @Delete(':sessionId')
  deleteSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.deleteSession(sessionId);
  }
}
