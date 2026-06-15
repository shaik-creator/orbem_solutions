USE operations_dashboard;

CREATE TABLE IF NOT EXISTS activity_logs (
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

CREATE TABLE IF NOT EXISTS tasks (
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

CREATE TABLE IF NOT EXISTS calendar_events (
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

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(150) NOT NULL,
  module VARCHAR(80),
  description TEXT NOT NULL,
  priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  status ENUM('Open','In Progress','Resolved','Closed') DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feature_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

SET @sql := IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND INDEX_NAME = 'idx_activity_logs_recent') = 0,
  'CREATE INDEX idx_activity_logs_recent ON activity_logs (created_at, action_type)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND INDEX_NAME = 'idx_tasks_status_due') = 0,
  'CREATE INDEX idx_tasks_status_due ON tasks (status, due_date)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'calendar_events' AND INDEX_NAME = 'idx_calendar_events_date') = 0,
  'CREATE INDEX idx_calendar_events_date ON calendar_events (event_date, event_type)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
