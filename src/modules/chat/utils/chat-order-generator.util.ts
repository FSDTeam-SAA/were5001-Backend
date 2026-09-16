export interface OrderPrefillPayload {
  actionType:
    | 'buy_gold'
    | 'sell_gold'
    | 'buy_item'
    | 'sell_item'
    | 'buy_account'
    | 'powerleveling'
    | 'service';
  game?: string; // 'osrs' | 'rs3'
  quantityM?: number;
  quantity?: number;
  gameCharacterName?: string;
  itemName?: string;
  itemId?: string;
  accountTitle?: string;
  accountId?: string;
  serviceName?: string;
  skillDetails?: string;
  totalPrice?: number;
  currency?: string;
  paymentMethod?: string;
  notes?: string;
  [key: string]: any;
}

export function generateFormattedOrderMessage(payload: OrderPrefillPayload): {
  formattedSummary: string;
  displayTitle: string;
} {
  const game = (payload.game || 'OSRS').toUpperCase();
  const currency = (payload.currency || 'USD').toUpperCase();
  const priceFormatted =
    payload.totalPrice !== undefined
      ? `$${Number(payload.totalPrice).toFixed(2)} ${currency}`
      : 'TBD';

  let displayTitle = '';
  const lines: string[] = [];

  switch (payload.actionType) {
    case 'buy_gold':
      displayTitle = `🛒 Buy Gold Order (${game})`;
      lines.push(`🎮 Game: **${game}**`);
      lines.push(`💰 Amount: **${payload.quantityM ?? payload.quantity ?? 0}M Gold**`);
      lines.push(`💵 Total Price: **${priceFormatted}**`);
      if (payload.gameCharacterName) {
        lines.push(`👤 Character Name: **${payload.gameCharacterName}**`);
      }
      if (payload.paymentMethod) {
        lines.push(`💳 Payment Method: **${payload.paymentMethod}**`);
      }
      break;

    case 'sell_gold':
      displayTitle = `💰 Sell Gold Request (${game})`;
      lines.push(`🎮 Game: **${game}**`);
      lines.push(`💰 Selling Amount: **${payload.quantityM ?? payload.quantity ?? 0}M Gold**`);
      lines.push(`💵 Payout: **${priceFormatted}**`);
      if (payload.gameCharacterName) {
        lines.push(`👤 In-Game Character: **${payload.gameCharacterName}**`);
      }
      if (payload.paymentMethod) {
        lines.push(`💳 Preferred Payout: **${payload.paymentMethod}**`);
      }
      break;

    case 'buy_item':
      displayTitle = `🗡️ Item Purchase (${game})`;
      lines.push(`🎮 Game: **${game}**`);
      lines.push(`🗡️ Item: **${payload.itemName || payload.itemId || 'Catalog Item'}**`);
      if (payload.quantity) {
        lines.push(`🔢 Quantity: **${payload.quantity}**`);
      }
      lines.push(`💵 Total: **${priceFormatted}**`);
      if (payload.gameCharacterName) {
        lines.push(`👤 Deliver To: **${payload.gameCharacterName}**`);
      }
      if (payload.paymentMethod) {
        lines.push(`💳 Payment: **${payload.paymentMethod}**`);
      }
      break;

    case 'buy_account':
      displayTitle = `🛡️ Account Purchase (${game})`;
      lines.push(`🎮 Game: **${game}**`);
      lines.push(
        `🛡️ Account: **${payload.accountTitle || payload.accountId || 'Verified Account'}**`,
      );
      lines.push(`💵 Price: **${priceFormatted}**`);
      if (payload.paymentMethod) {
        lines.push(`💳 Payment: **${payload.paymentMethod}**`);
      }
      break;

    case 'powerleveling':
    case 'service':
      displayTitle = `⚡ Powerleveling / Service (${game})`;
      lines.push(`🎮 Game: **${game}**`);
      lines.push(`⚡ Service: **${payload.serviceName || 'Custom Service'}**`);
      if (payload.skillDetails) {
        lines.push(`📈 Details: **${payload.skillDetails}**`);
      }
      lines.push(`💵 Estimated Quote: **${priceFormatted}**`);
      if (payload.gameCharacterName) {
        lines.push(`👤 Character: **${payload.gameCharacterName}**`);
      }
      break;

    default:
      displayTitle = `📋 Support / Service Request`;
      lines.push(`🎮 Game: **${game}**`);
      lines.push(`💵 Quoted Price: **${priceFormatted}**`);
      if (payload.gameCharacterName) {
        lines.push(`👤 Character: **${payload.gameCharacterName}**`);
      }
      break;
  }

  if (payload.notes) {
    lines.push(`📝 Notes: ${payload.notes}`);
  }

  const formattedSummary = `${displayTitle}\n────────────────────────\n${lines.join('\n')}`;

  return {
    formattedSummary,
    displayTitle,
  };
}
