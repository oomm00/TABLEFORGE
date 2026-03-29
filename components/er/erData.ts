// ────────────────────────────────────────────────────────────────
// ER DIAGRAM — Shared data types and mock data
// ────────────────────────────────────────────────────────────────

export interface ColDef {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  nullable?: boolean;
}

export interface TableDef {
  id: string;
  label: string;
  rowCount: number;
  isLegacy?: boolean;
  columns: ColDef[];
  x: number;
  y: number;
}

export interface RelationDef {
  id: string;
  from: string;
  fromCol: string;
  to: string;
  toCol: string;
  type: string;
  onDelete: string;
  onUpdate: string;
}

export const TABLES: TableDef[] = [
  {
    id: 'users', label: 'users', rowCount: 124530, x: 50, y: 60,
    columns: [
      { name: 'id',         type: 'uuid',      isPk: true,  nullable: false },
      { name: 'email',      type: 'varchar',               nullable: false },
      { name: 'status',     type: 'varchar' },
      { name: 'created_at', type: 'timestamp',             nullable: false },
    ],
  },
  {
    id: 'orders', label: 'orders', rowCount: 892310, x: 450, y: 0,
    columns: [
      { name: 'id',         type: 'uuid',    isPk: true, nullable: false },
      { name: 'user_id',    type: 'uuid',    isFk: true, nullable: false },
      { name: 'product_id', type: 'uuid',    isFk: true },
      { name: 'amount',     type: 'numeric',             nullable: false },
      { name: 'status',     type: 'varchar' },
    ],
  },
  {
    id: 'products', label: 'products', rowCount: 3480, x: 450, y: 310,
    columns: [
      { name: 'id',       type: 'uuid',    isPk: true, nullable: false },
      { name: 'name',     type: 'varchar',             nullable: false },
      { name: 'price',    type: 'numeric',             nullable: false },
      { name: 'category', type: 'varchar' },
    ],
  },
  {
    id: 'payments', label: 'payments', rowCount: 785400, x: 870, y: 20,
    columns: [
      { name: 'id',           type: 'uuid',      isPk: true, nullable: false },
      { name: 'order_id',     type: 'uuid',      isFk: true, nullable: false },
      { name: 'method',       type: 'varchar' },
      { name: 'processed_at', type: 'timestamp' },
    ],
  },
  {
    id: 'subscriptions', label: 'subscriptions', rowCount: 41200, x: 870, y: 310,
    columns: [
      { name: 'id',         type: 'uuid',      isPk: true, nullable: false },
      { name: 'user_id',    type: 'uuid',      isFk: true, nullable: false },
      { name: 'plan',       type: 'varchar',               nullable: false },
      { name: 'expires_at', type: 'timestamp' },
    ],
  },
  {
    id: 'events', label: 'events', rowCount: 12450000, x: 50, y: 380,
    columns: [
      { name: 'id',         type: 'bigint',  isPk: true, nullable: false },
      { name: 'user_id',    type: 'uuid',    isFk: true },
      { name: 'event_type', type: 'varchar',             nullable: false },
      { name: 'payload',    type: 'jsonb' },
    ],
  },
  {
    id: 'legacy_users', label: 'legacy_users', rowCount: 8920, isLegacy: true, x: 50, y: 650,
    columns: [
      { name: 'id',         type: 'serial',    isPk: true, nullable: false },
      { name: 'username',   type: 'varchar' },
      { name: 'last_login', type: 'timestamp' },
    ],
  },
];

export const RELATIONS: RelationDef[] = [
  { id: 'rel-users-orders',   from: 'users', fromCol: 'id', to: 'orders', toCol: 'user_id', type: 'One-to-Many', onDelete: 'CASCADE',  onUpdate: 'NO ACTION' },
  { id: 'rel-products-orders',from: 'products', fromCol: 'id', to: 'orders', toCol: 'product_id', type: 'One-to-Many', onDelete: 'RESTRICT', onUpdate: 'CASCADE'  },
  { id: 'rel-orders-payments',from: 'orders', fromCol: 'id', to: 'payments', toCol: 'order_id', type: 'One-to-Many', onDelete: 'CASCADE',  onUpdate: 'NO ACTION' },
  { id: 'rel-users-subs',     from: 'users', fromCol: 'id', to: 'subscriptions', toCol: 'user_id', type: 'One-to-Many', onDelete: 'CASCADE',  onUpdate: 'NO ACTION' },
  { id: 'rel-users-events',   from: 'users', fromCol: 'id', to: 'events', toCol: 'user_id', type: 'One-to-Many', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
];
