USE operations_dashboard;

-- Ensure revenue table exists with all correct columns
CREATE TABLE IF NOT EXISTS revenue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NULL,
  customer_id INT NULL,
  invoice_number VARCHAR(50) UNIQUE,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status ENUM('Paid','Pending','Partial','Overdue') DEFAULT 'Pending',
  due_date DATE NULL,
  paid_at DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_revenue_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_revenue_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Safely add balance_amount to revenue if the table existed before but lacked it
-- We run a procedure to conditionally add the column if it's missing
DROP PROCEDURE IF EXISTS AddBalanceAmountColumn;
DELIMITER //
CREATE PROCEDURE AddBalanceAmountColumn()
BEGIN
  DECLARE col_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO col_exists 
  FROM information_schema.columns 
  WHERE table_schema = 'operations_dashboard' 
    AND table_name = 'revenue' 
    AND column_name = 'balance_amount';
    
  IF col_exists = 0 THEN
    ALTER TABLE revenue ADD COLUMN balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
END //
DELIMITER ;
CALL AddBalanceAmountColumn();
DROP PROCEDURE IF EXISTS AddBalanceAmountColumn;

-- Ensure payment_status in revenue is enum or updated
ALTER TABLE revenue MODIFY COLUMN payment_status ENUM('Paid','Pending','Partial','Overdue') DEFAULT 'Pending';

-- 1. Recalculate balance and payment status for existing payments
UPDATE payments
SET
  balance_amount = GREATEST(invoice_amount - paid_amount, 0),
  payment_status = CASE
    WHEN GREATEST(invoice_amount - paid_amount, 0) <= 0 THEN 'Paid'
    WHEN GREATEST(invoice_amount - paid_amount, 0) > 0 AND due_date < CURDATE() THEN 'Overdue'
    WHEN GREATEST(invoice_amount - paid_amount, 0) > 0 AND paid_amount > 0 THEN 'Partial'
    ELSE 'Pending'
  END,
  paid_at = CASE
    WHEN GREATEST(invoice_amount - paid_amount, 0) <= 0 THEN COALESCE(paid_at, NOW())
    ELSE NULL
  END;

-- 2. Recalculate balance and payment status for existing revenue
UPDATE revenue
SET
  balance_amount = GREATEST(amount - paid_amount, 0),
  payment_status = CASE
    WHEN GREATEST(amount - paid_amount, 0) <= 0 THEN 'Paid'
    WHEN GREATEST(amount - paid_amount, 0) > 0 AND due_date < CURDATE() THEN 'Overdue'
    WHEN GREATEST(amount - paid_amount, 0) > 0 AND paid_amount > 0 THEN 'Partial'
    ELSE 'Pending'
  END,
  paid_at = CASE
    WHEN GREATEST(amount - paid_amount, 0) <= 0 THEN COALESCE(paid_at, NOW())
    ELSE NULL
  END;
