-- ShareBite MySQL schema (raw SQL alternative to SQLAlchemy auto-create).
-- Usage:  mysql -u root -p < schema.sql
CREATE DATABASE IF NOT EXISTS sharebite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sharebite;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(40) PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) DEFAULT '',
  address VARCHAR(300) DEFAULT '',
  latitude DOUBLE NULL,
  longitude DOUBLE NULL,
  service_radius_km DOUBLE DEFAULT 25.0,
  accepted_categories JSON,
  min_quantity DOUBLE DEFAULT 0.0,
  max_quantity DOUBLE DEFAULT 0.0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  org_name VARCHAR(160) DEFAULT '',
  donor_type VARCHAR(30) DEFAULT '',
  registration_number VARCHAR(60) DEFAULT '',
  verified BOOLEAN DEFAULT FALSE,
  area VARCHAR(120) DEFAULT '',
  vehicle VARCHAR(120) DEFAULT '',
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS donations (
  id VARCHAR(40) PRIMARY KEY,
  donor_id VARCHAR(40) NOT NULL,
  food_name VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL,
  diet VARCHAR(10) NOT NULL,
  quantity FLOAT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  prepared_at DATETIME NOT NULL,
  available_until DATETIME NOT NULL,
  storage VARCHAR(20) NOT NULL,
  pickup_address VARCHAR(300) NOT NULL,
  pickup_latitude DOUBLE NULL,
  pickup_longitude DOUBLE NULL,
  instructions TEXT,
  image_url TEXT,
  safety_declared BOOLEAN DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  accepted_by VARCHAR(40) NULL,
  volunteer_id VARCHAR(40) NULL,
  task_id VARCHAR(40) NULL,
  rejected_by JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_donations_status (status),
  INDEX idx_donations_donor (donor_id),
  FOREIGN KEY (donor_id) REFERENCES users(id),
  FOREIGN KEY (accepted_by) REFERENCES users(id),
  FOREIGN KEY (volunteer_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS donation_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  at DATETIME DEFAULT CURRENT_TIMESTAMP,
  by VARCHAR(40) NULL,
  note VARCHAR(300) DEFAULT '',
  INDEX idx_events_donation (donation_id),
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collection_tasks (
  id VARCHAR(40) PRIMARY KEY,
  donation_id VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  volunteer_id VARCHAR(40) NULL,
  declined_by JSON,
  distance_km DOUBLE DEFAULT 0.0,
  pickup_address VARCHAR(300) DEFAULT '',
  delivery_address VARCHAR(300) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_status (status),
  FOREIGN KEY (donation_id) REFERENCES donations(id),
  FOREIGN KEY (volunteer_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS task_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  at DATETIME DEFAULT CURRENT_TIMESTAMP,
  by VARCHAR(40) NULL,
  note VARCHAR(300) DEFAULT '',
  INDEX idx_tevents_task (task_id),
  FOREIGN KEY (task_id) REFERENCES collection_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(400) DEFAULT '',
  donation_id VARCHAR(40) NULL,
  `read` BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;