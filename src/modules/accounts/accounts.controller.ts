import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  QueryAccountDto,
} from './dto/account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // ─── OSRS Accounts ──────────────────────────────────────────────────────────
  @Get('osrs')
  getAllOsrsAccounts(@Query() query: QueryAccountDto) {
    return this.accountsService.getAllAccounts('osrs', query);
  }

  @Get('osrs/:id')
  getOsrsAccountById(@Param('id') id: string) {
    return this.accountsService.getAccountById('osrs', id);
  }

  @Post('osrs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createOsrsAccount(@Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount('osrs', dto);
  }

  @Put('osrs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateOsrsAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.updateAccount('osrs', id, dto);
  }

  @Patch('osrs/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  adjustOsrsStock(@Param('id') id: string, @Body('amount') amount: number) {
    return this.accountsService.adjustStock('osrs', id, amount);
  }

  @Delete('osrs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteOsrsAccount(@Param('id') id: string) {
    return this.accountsService.deleteAccount('osrs', id);
  }

  // ─── RS3 Accounts ───────────────────────────────────────────────────────────
  @Get('rs3')
  getAllRs3Accounts(@Query() query: QueryAccountDto) {
    return this.accountsService.getAllAccounts('rs3', query);
  }

  @Get('rs3/:id')
  getRs3AccountById(@Param('id') id: string) {
    return this.accountsService.getAccountById('rs3', id);
  }

  @Post('rs3')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createRs3Account(@Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount('rs3', dto);
  }

  @Put('rs3/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateRs3Account(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.updateAccount('rs3', id, dto);
  }

  @Patch('rs3/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  adjustRs3Stock(@Param('id') id: string, @Body('amount') amount: number) {
    return this.accountsService.adjustStock('rs3', id, amount);
  }

  @Delete('rs3/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteRs3Account(@Param('id') id: string) {
    return this.accountsService.deleteAccount('rs3', id);
  }
}
