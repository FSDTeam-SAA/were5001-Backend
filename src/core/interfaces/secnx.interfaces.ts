import { Types } from 'mongoose';

// ─── Identity & Access Management ─────────────────────────────────────────────
export interface IUserSecnx {
  id?: number | string;
  _id?: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  data?: Record<string, any>;
  banned: boolean;
  admin: boolean;
  verify: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISession {
  _id?: Types.ObjectId;
  sessionId: string;
  userId?: Types.ObjectId;
  data?: Record<string, any> | string;
  expiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Accounts Catalog ─────────────────────────────────────────────────────────
export interface IAccount {
  _id?: Types.ObjectId;
  acc_id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IOsrsAccount = IAccount;
export type IRs3Account = IAccount;

// ─── Items & Services Catalog ─────────────────────────────────────────────────
export interface IItem {
  _id?: Types.ObjectId;
  item_id: string;
  name: string;
  image: string;
  inStock: boolean;
  visible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IOsrsItem = IItem;
export type IRs3Item = IItem;

export interface ISkilling {
  _id?: Types.ObjectId;
  item_id: string;
  name: string;
  image: string;
  methods: Record<string, any>;
  visible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Pricing, Currencies & Payment Gateway ─────────────────────────────────────
export interface IValute {
  _id?: Types.ObjectId;
  real_id: string;
  name: string;
  image: string;
  osrs_buy: number;
  osrs_sell: number;
  rs3_buy: number;
  rs3_sell: number;
  paytriot: boolean;
  login_required: boolean;
  buy_limit_min: number;
  buy_limit_max: number;
  sell_limit_min: number;
  sell_limit_max: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IItemsPrice {
  _id?: Types.ObjectId;
  osrs: number;
  rs3: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentGateway {
  _id?: Types.ObjectId;
  valuteId?: Types.ObjectId;
  osrs_buy: Record<string, any>;
  osrs_sell: Record<string, any>;
  rs3_buy: Record<string, any>;
  rs3_sell: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
