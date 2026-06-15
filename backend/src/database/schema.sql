CREATE DATABASE IF NOT EXISTS operations_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE operations_dashboard;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS airline_rates;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS shipment_milestones;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin / Owner','Operations Staff','Documentation Executive','Warehouse Staff','Accounts Staff','Partner Manager') NOT NULL DEFAULT 'Operations Staff',
  phone VARCHAR(30),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  password_updated_at TIMESTAMP NULL,
  status_message VARCHAR(150)
);

CREATE TABLE user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_setting (user_id, setting_key),
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(140) NOT NULL,
  company_name VARCHAR(180) NOT NULL,
  email VARCHAR(160),
  phone VARCHAR(30),
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(40) NOT NULL UNIQUE,
  customer_id INT NULL,
  customer_name VARCHAR(140) NOT NULL,
  customer_email VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  company_name VARCHAR(180) NOT NULL,
  origin_airport VARCHAR(12) NOT NULL,
  destination_airport VARCHAR(12) NOT NULL,
  pickup_city VARCHAR(100) NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  cargo_type VARCHAR(80) NOT NULL,
  cargo_description TEXT,
  package_count INT NOT NULL DEFAULT 1,
  actual_weight DECIMAL(10,2) NOT NULL,
  length_cm DECIMAL(10,2) NOT NULL,
  width_cm DECIMAL(10,2) NOT NULL,
  height_cm DECIMAL(10,2) NOT NULL,
  volumetric_weight DECIMAL(10,2) NOT NULL,
  chargeable_weight DECIMAL(10,2) NOT NULL,
  shipment_status ENUM('Booked','Picked Up','In Warehouse','Documents Pending','Ready for Dispatch','In Transit','Customs Hold','Delivered','Delayed','Completed','Cancelled') NOT NULL DEFAULT 'Booked',
  booking_date DATE NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE NULL,
  assigned_owner_id INT NULL,
  priority ENUM('Low','Normal','High','Critical') NOT NULL DEFAULT 'Normal',
  notes TEXT,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_owner FOREIGN KEY (assigned_owner_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE shipment_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  status VARCHAR(60) NOT NULL,
  location VARCHAR(120),
  remarks TEXT,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_milestones_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_milestones_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  document_type ENUM('Airway Bill','Invoice','Packing List','ID Proof','Cargo Declaration','Customs Checklist','Insurance Document','Delivery Proof') NOT NULL,
  status ENUM('Pending','Received','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  file_name VARCHAR(180),
  file_url VARCHAR(255),
  remarks TEXT,
  verified_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_document_booking_type (booking_id, document_type),
  CONSTRAINT fk_documents_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_user FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  quotation_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  invoice_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status ENUM('Pending','Partial','Paid','Overdue') NOT NULL DEFAULT 'Pending',
  payment_date DATE NULL,
  payment_method VARCHAR(80),
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE airline_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  airline_name VARCHAR(140) NOT NULL,
  origin_airport VARCHAR(12) NOT NULL,
  destination_airport VARCHAR(12) NOT NULL,
  rate_per_kg DECIMAL(10,2) NOT NULL,
  fuel_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0,
  handling_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NULL,
  customer_name VARCHAR(140) NOT NULL,
  title VARCHAR(180) NOT NULL,
  status ENUM('Open','In Review','Resolved','Closed') NOT NULL DEFAULT 'Open',
  priority ENUM('Low','Normal','High','Critical') NOT NULL DEFAULT 'Normal',
  assigned_to INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaints_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  CONSTRAINT fk_complaints_user FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(150) NOT NULL,
  module VARCHAR(80),
  description TEXT NOT NULL,
  priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  status ENUM('Open','In Progress','Resolved','Closed') DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action_type VARCHAR(60) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  related_type VARCHAR(60),
  related_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  priority ENUM('Low','Normal','High','Critical') NOT NULL DEFAULT 'Normal',
  assigned_to INT NULL,
  due_date DATE NULL,
  status ENUM('To Do','In Progress','Waiting','Completed') NOT NULL DEFAULT 'To Do',
  related_booking_id INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_booking FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  event_type ENUM('Delivery','Payment','Document','Pickup','Dispatch','General') NOT NULL DEFAULT 'General',
  event_date DATE NOT NULL,
  event_time TIME NULL,
  related_type VARCHAR(60),
  related_id INT NULL,
  status VARCHAR(60),
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_calendar_events_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('Shipment','Document','Payment','Reminder','System') NOT NULL DEFAULT 'System',
  severity ENUM('Info','Warning','Critical') NOT NULL DEFAULT 'Info',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  related_booking_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_notifications_booking FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  role ENUM('user','assistant') NOT NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_bookings_status ON bookings (shipment_status);
CREATE INDEX idx_bookings_dates ON bookings (booking_date, expected_delivery_date);
CREATE INDEX idx_bookings_route ON bookings (origin_airport, destination_airport);
CREATE INDEX idx_payments_status ON payments (payment_status);
CREATE INDEX idx_documents_status ON documents (status);
CREATE INDEX idx_rates_route ON airline_rates (origin_airport, destination_airport);
CREATE INDEX idx_activity_logs_recent ON activity_logs (created_at, action_type);
CREATE INDEX idx_tasks_status_due ON tasks (status, due_date);
CREATE INDEX idx_calendar_events_date ON calendar_events (event_date, event_type);
