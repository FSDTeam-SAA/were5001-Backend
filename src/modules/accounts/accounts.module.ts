import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OsrsAccount, OsrsAccountSchema } from './schemas/osrs-account.schema';
import { Rs3Account, Rs3AccountSchema } from './schemas/rs3-account.schema';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OsrsAccount.name, schema: OsrsAccountSchema },
      { name: Rs3Account.name, schema: Rs3AccountSchema },
    ]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService, MongooseModule],
})
export class AccountsModule {}
