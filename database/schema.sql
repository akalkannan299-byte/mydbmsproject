CREATE DATABASE IF NOT EXISTS noirbite_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE noirbite_db;

CREATE TABLE IF NOT EXISTS food_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS food_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  image_url VARCHAR(600),
  category_id BIGINT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  daily_special BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_food_category FOREIGN KEY (category_id) REFERENCES food_categories(id),
  INDEX idx_food_available (available),
  INDEX idx_food_category (category_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  order_type VARCHAR(20) NOT NULL,
  table_number INT NULL,
  instructions VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_phone (phone),
  INDEX idx_order_status (status),
  INDEX idx_order_created (created_at)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  food_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_item_food FOREIGN KEY (food_id) REFERENCES food_items(id),
  CONSTRAINT chk_quantity CHECK (quantity > 0),
  INDEX idx_order_item_order (order_id)
);
