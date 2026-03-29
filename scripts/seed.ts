import { config } from "dotenv";
config();

import { Pool } from "pg";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const userIds: string[] = [];
const productIds: string[] = [];
const orderIds: string[] = [];

export async function seed() {
  console.log('Starting database seeding...');

  // Create tables if they do not exist
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    status INT,
    created_at TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name TEXT,
    price FLOAT
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INT
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    rating INT
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS legacy_users (
    id UUID PRIMARY KEY,
    name TEXT,
    active BOOLEAN
  )`);

  // Insert users
  const users = [];
  for (let i = 0; i < 100; i++) {
    const id = randomUUID();
    const name = faker.person.fullName();
    const email = faker.internet.email();
    const status = i < 10 ? 4 : faker.number.int({ min: 1, max: 3 }); // Some churned users
    const created_at = faker.date.past({ years: 4 });

    const result = await pool.query(
      'INSERT INTO users (id, name, email, status, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, name, email, status, created_at]
    );
    users.push({ id, name, email, status, created_at });
    userIds.push(id);
  }
  console.log(`Inserted ${users.length} users`);

  // Insert products
  const products = [];
  for (let i = 0; i < 50; i++) {
    const id = randomUUID();
    const name = faker.commerce.productName();
    const price = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });

    const result = await pool.query(
      'INSERT INTO products (id, name, price) VALUES ($1, $2, $3)',
      [id, name, price]
    );
    products.push({ id, name, price });
    productIds.push(id);
  }
  console.log(`Inserted ${products.length} products`);

  // Insert orders
  const orders = [];
  for (let i = 0; i < 100; i++) {
    const id = randomUUID();
    const userIndex = faker.number.int({ min: 0, max: userIds.length - 1 });
    const userId = userIds[userIndex];
    const user = users[userIndex];
    const created_at = faker.date.between({ from: user.created_at, to: new Date() });

    const result = await pool.query(
      'INSERT INTO orders (id, user_id, created_at) VALUES ($1, $2, $3)',
      [id, userId, created_at]
    );
    orders.push({ id, user_id: userId, created_at });
    orderIds.push(id);
  }
  console.log(`Inserted ${orders.length} orders`);

  // Insert order_items
  for (let i = 0; i < 200; i++) {
    const id = randomUUID();
    const orderId = faker.helpers.arrayElement(orderIds);
    const productId = faker.helpers.arrayElement(productIds);
    const quantity = faker.number.int({ min: 1, max: 5 });

    await pool.query(
      'INSERT INTO order_items (id, order_id, product_id, quantity) VALUES ($1, $2, $3, $4)',
      [id, orderId, productId, quantity]
    );
  }
  console.log('Inserted 200 order items');

  // Insert reviews
  for (let i = 0; i < 50; i++) {
    const id = randomUUID();
    const userId = faker.helpers.arrayElement(userIds);
    const productId = faker.helpers.arrayElement(productIds);
    const rating = faker.number.int({ min: 1, max: 5 });

    await pool.query(
      'INSERT INTO reviews (id, user_id, product_id, rating) VALUES ($1, $2, $3, $4)',
      [id, userId, productId, rating]
    );
  }
  console.log('Inserted 50 reviews');

  // Insert legacy_users
  for (let i = 0; i < 20; i++) {
    const id = randomUUID();
    const name = faker.person.fullName();
    const active = i < 5 ? true : false; // Some active legacy users

    await pool.query(
      'INSERT INTO legacy_users (id, name, active) VALUES ($1, $2, $3)',
      [id, name, active]
    );
  }
  console.log('Inserted 20 legacy users');

  console.log('Database seeding completed successfully!');
}

seed()
  .then(() => {
    console.log("Seeding complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });