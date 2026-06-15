USE operations_dashboard;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE chat_messages;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE tasks;
TRUNCATE TABLE calendar_events;
TRUNCATE TABLE user_settings;
TRUNCATE TABLE support_tickets;
TRUNCATE TABLE notifications;
TRUNCATE TABLE complaints;
TRUNCATE TABLE airline_rates;
TRUNCATE TABLE payments;
TRUNCATE TABLE documents;
TRUNCATE TABLE shipment_milestones;
TRUNCATE TABLE bookings;
TRUNCATE TABLE customers;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Demo password for every seeded user: password
INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
(1, 'Ananya Rao', 'admin@orbem.local', '$2a$10$PkFgXGCH7JzC5MasHs1YJe2fEUqc5GTJypbmaLZbTMqfofv3XP4am', 'Admin / Owner', '+91 98765 10001'),
(2, 'Rahul Menon', 'ops@orbem.local', '$2a$10$PkFgXGCH7JzC5MasHs1YJe2fEUqc5GTJypbmaLZbTMqfofv3XP4am', 'Operations Staff', '+91 98765 10002'),
(3, 'Meera Shah', 'docs@orbem.local', '$2a$10$PkFgXGCH7JzC5MasHs1YJe2fEUqc5GTJypbmaLZbTMqfofv3XP4am', 'Documentation Executive', '+91 98765 10003'),
(4, 'Imran Khan', 'warehouse@orbem.local', '$2a$10$PkFgXGCH7JzC5MasHs1YJe2fEUqc5GTJypbmaLZbTMqfofv3XP4am', 'Warehouse Staff', '+91 98765 10004'),
(5, 'Priya Nair', 'accounts@orbem.local', '$2a$10$PkFgXGCH7JzC5MasHs1YJe2fEUqc5GTJypbmaLZbTMqfofv3XP4am', 'Accounts Staff', '+91 98765 10005');

INSERT INTO customers (id, customer_name, company_name, email, phone, city) VALUES
(1, 'Suresh Patel', 'Apex Pharma Logistics', 'suresh@apexpharma.example', '+91 98200 11101', 'Mumbai'),
(2, 'Neha Iyer', 'Bright Components India', 'neha@brightcomponents.example', '+91 98200 11102', 'Bengaluru'),
(3, 'Arjun Singh', 'NorthStar Textiles', 'arjun@northstar.example', '+91 98200 11103', 'Delhi'),
(4, 'Fatima Ansari', 'FreshLeaf Exports', 'fatima@freshleaf.example', '+91 98200 11104', 'Hyderabad'),
(5, 'Karan Mehta', 'MedSwift Supplies', 'karan@medswift.example', '+91 98200 11105', 'Ahmedabad'),
(6, 'Divya Krishnan', 'UrbanTech Devices', 'divya@urbantech.example', '+91 98200 11106', 'Chennai'),
(7, 'Vikram Sethi', 'Craftline Furnishings', 'vikram@craftline.example', '+91 98200 11107', 'Jaipur'),
(8, 'Aisha Thomas', 'Coastal Marine Parts', 'aisha@coastalmarine.example', '+91 98200 11108', 'Kochi'),
(9, 'Manoj Das', 'Eastern Retail Hub', 'manoj@easternretail.example', '+91 98200 11109', 'Kolkata'),
(10, 'Pooja Reddy', 'GreenHarvest Foods', 'pooja@greenharvest.example', '+91 98200 11110', 'Pune');

INSERT INTO bookings
(id, booking_id, customer_id, customer_name, customer_email, customer_phone, company_name, origin_airport, destination_airport, pickup_city, delivery_city, cargo_type, cargo_description, package_count, actual_weight, length_cm, width_cm, height_cm, volumetric_weight, chargeable_weight, shipment_status, booking_date, expected_delivery_date, actual_delivery_date, assigned_owner_id, priority, notes, created_by)
VALUES
(1, 'ORB-2026-0001', 1, 'Suresh Patel', 'suresh@apexpharma.example', '+91 98200 11101', 'Apex Pharma Logistics', 'BOM', 'DXB', 'Mumbai', 'Dubai', 'Pharmaceuticals', 'Temperature-sensitive sample medicines, packed in validated cool boxes', 8, 210.00, 80.00, 60.00, 55.00, 352.00, 352.00, 'Delivered', '2026-05-01', '2026-05-05', '2026-05-04', 2, 'High', 'Cold-chain handover completed with consignee.', 1),
(2, 'ORB-2026-0002', 2, 'Neha Iyer', 'neha@brightcomponents.example', '+91 98200 11102', 'Bright Components India', 'BLR', 'SIN', 'Bengaluru', 'Singapore', 'Electronics', 'PCB assemblies in anti-static cartons', 12, 165.00, 65.00, 45.00, 35.00, 204.75, 204.75, 'In Transit', '2026-05-03', '2026-06-13', NULL, 2, 'Normal', 'Customer requested proactive arrival update.', 2),
(3, 'ORB-2026-0003', 3, 'Arjun Singh', 'arjun@northstar.example', '+91 98200 11103', 'NorthStar Textiles', 'DEL', 'LHR', 'Delhi', 'London', 'Textiles', 'Cotton fabric rolls with commercial invoice', 18, 520.00, 110.00, 50.00, 45.00, 742.50, 742.50, 'Documents Pending', '2026-05-06', '2026-06-09', NULL, 3, 'High', 'Packing list correction pending from customer.', 2),
(4, 'ORB-2026-0004', 4, 'Fatima Ansari', 'fatima@freshleaf.example', '+91 98200 11104', 'FreshLeaf Exports', 'HYD', 'DOH', 'Hyderabad', 'Doha', 'Perishables', 'Vacuum-packed fresh herbs, airport-to-airport', 10, 130.00, 70.00, 50.00, 40.00, 233.33, 233.33, 'Delayed', '2026-05-08', '2026-05-15', NULL, 2, 'Critical', 'Flight uplift delayed due to capacity constraint.', 1),
(5, 'ORB-2026-0005', 5, 'Karan Mehta', 'karan@medswift.example', '+91 98200 11105', 'MedSwift Supplies', 'AMD', 'FRA', 'Ahmedabad', 'Frankfurt', 'Medical Equipment', 'Sterile diagnostic kits with fragile labels', 6, 300.00, 85.00, 60.00, 50.00, 255.00, 300.00, 'Customs Hold', '2026-05-10', '2026-06-14', NULL, 2, 'High', 'HS code clarification requested by broker.', 2),
(6, 'ORB-2026-0006', 6, 'Divya Krishnan', 'divya@urbantech.example', '+91 98200 11106', 'UrbanTech Devices', 'MAA', 'HKG', 'Chennai', 'Hong Kong', 'Electronics', 'Consumer device accessories in master cartons', 15, 410.00, 75.00, 55.00, 48.00, 495.00, 495.00, 'Ready for Dispatch', '2026-05-13', '2026-06-15', NULL, 4, 'Normal', 'Warehouse scan completed.', 2),
(7, 'ORB-2026-0007', 7, 'Vikram Sethi', 'vikram@craftline.example', '+91 98200 11107', 'Craftline Furnishings', 'JAI', 'JED', 'Jaipur', 'Jeddah', 'Furniture Samples', 'Wooden sample panels, non-stackable', 5, 260.00, 120.00, 70.00, 60.00, 420.00, 420.00, 'Booked', '2026-05-15', '2026-06-18', NULL, 2, 'Normal', 'Pickup scheduled with customer warehouse.', 1),
(8, 'ORB-2026-0008', 8, 'Aisha Thomas', 'aisha@coastalmarine.example', '+91 98200 11108', 'Coastal Marine Parts', 'COK', 'AMS', 'Kochi', 'Amsterdam', 'Machinery Parts', 'Machined stainless steel pump spares', 7, 720.00, 95.00, 60.00, 50.00, 332.50, 720.00, 'Completed', '2026-05-17', '2026-05-24', '2026-05-23', 2, 'Normal', 'Payment received after delivery.', 1),
(9, 'ORB-2026-0009', 9, 'Manoj Das', 'manoj@easternretail.example', '+91 98200 11109', 'Eastern Retail Hub', 'CCU', 'BKK', 'Kolkata', 'Bangkok', 'Retail Goods', 'Assorted apparel cartons for store launch', 22, 600.00, 90.00, 55.00, 45.00, 816.75, 816.75, 'Delayed', '2026-05-19', '2026-05-30', NULL, 2, 'High', 'Awaiting revised flight confirmation.', 2),
(10, 'ORB-2026-0010', 10, 'Pooja Reddy', 'pooja@greenharvest.example', '+91 98200 11110', 'GreenHarvest Foods', 'PNQ', 'DXB', 'Pune', 'Dubai', 'Food Products', 'Dry packaged millet snacks', 14, 240.00, 60.00, 45.00, 40.00, 252.00, 252.00, 'In Warehouse', '2026-05-21', '2026-06-12', NULL, 4, 'Normal', 'Cargo received and palletized.', 2),
(11, 'ORB-2026-0011', 1, 'Suresh Patel', 'suresh@apexpharma.example', '+91 98200 11101', 'Apex Pharma Logistics', 'BOM', 'SIN', 'Mumbai', 'Singapore', 'Pharmaceuticals', 'Clinical trial kits with dry ice packaging', 9, 190.00, 70.00, 50.00, 45.00, 236.25, 236.25, 'Picked Up', '2026-06-01', '2026-06-16', NULL, 2, 'Critical', 'Dry ice replenishment planned before dispatch.', 1),
(12, 'ORB-2026-0012', 2, 'Neha Iyer', 'neha@brightcomponents.example', '+91 98200 11102', 'Bright Components India', 'BLR', 'FRA', 'Bengaluru', 'Frankfurt', 'Electronics', 'Server replacement units, serial numbers listed', 4, 140.00, 80.00, 50.00, 50.00, 133.33, 140.00, 'Documents Pending', '2026-06-02', '2026-06-17', NULL, 3, 'High', 'Insurance document pending.', 2),
(13, 'ORB-2026-0013', 3, 'Arjun Singh', 'arjun@northstar.example', '+91 98200 11103', 'NorthStar Textiles', 'DEL', 'DXB', 'Delhi', 'Dubai', 'Garments', 'Finished garments, buyer nominated consignee', 16, 430.00, 95.00, 45.00, 40.00, 456.00, 456.00, 'Ready for Dispatch', '2026-06-03', '2026-06-13', NULL, 4, 'Normal', 'Carrier booking confirmed.', 2),
(14, 'ORB-2026-0014', 4, 'Fatima Ansari', 'fatima@freshleaf.example', '+91 98200 11104', 'FreshLeaf Exports', 'HYD', 'SIN', 'Hyderabad', 'Singapore', 'Perishables', 'Dried fruit boxes, moisture controlled', 11, 210.00, 65.00, 45.00, 38.00, 203.78, 210.00, 'In Transit', '2026-06-04', '2026-06-12', NULL, 2, 'Normal', 'Transit arrival expected tomorrow.', 1),
(15, 'ORB-2026-0015', 5, 'Karan Mehta', 'karan@medswift.example', '+91 98200 11105', 'MedSwift Supplies', 'AMD', 'LHR', 'Ahmedabad', 'London', 'Medical Equipment', 'Non-hazardous diagnostic analyzer accessories', 5, 360.00, 100.00, 55.00, 50.00, 229.17, 360.00, 'Booked', '2026-06-05', '2026-06-20', NULL, 2, 'High', 'Customer asked for rate comparison before final dispatch.', 2),
(16, 'ORB-2026-0016', 6, 'Divya Krishnan', 'divya@urbantech.example', '+91 98200 11106', 'UrbanTech Devices', 'MAA', 'AMS', 'Chennai', 'Amsterdam', 'Electronics', 'IoT gateway units, lithium battery declaration attached', 10, 260.00, 70.00, 50.00, 42.00, 245.00, 260.00, 'Customs Hold', '2026-06-06', '2026-06-14', NULL, 2, 'High', 'Battery declaration under review.', 2),
(17, 'ORB-2026-0017', 7, 'Vikram Sethi', 'vikram@craftline.example', '+91 98200 11107', 'Craftline Furnishings', 'JAI', 'DOH', 'Jaipur', 'Doha', 'Decor Samples', 'Ceramic tile samples in reinforced crates', 6, 480.00, 90.00, 70.00, 55.00, 346.50, 480.00, 'Delivered', '2026-06-07', '2026-06-10', '2026-06-10', 2, 'Normal', 'Delivery proof received.', 1),
(18, 'ORB-2026-0018', 8, 'Aisha Thomas', 'aisha@coastalmarine.example', '+91 98200 11108', 'Coastal Marine Parts', 'COK', 'SIN', 'Kochi', 'Singapore', 'Machinery Parts', 'Marine valve kits, oil-free packaging', 8, 620.00, 85.00, 65.00, 55.00, 405.17, 620.00, 'In Warehouse', '2026-06-08', '2026-06-18', NULL, 4, 'Normal', 'Awaiting dispatch slot.', 2),
(19, 'ORB-2026-0019', 9, 'Manoj Das', 'manoj@easternretail.example', '+91 98200 11109', 'Eastern Retail Hub', 'CCU', 'DXB', 'Kolkata', 'Dubai', 'Retail Goods', 'Display fixtures and promotional materials', 13, 390.00, 75.00, 60.00, 45.00, 438.75, 438.75, 'Booked', '2026-06-09', '2026-06-21', NULL, 2, 'Low', 'Awaiting pickup confirmation.', 1),
(20, 'ORB-2026-0020', 10, 'Pooja Reddy', 'pooja@greenharvest.example', '+91 98200 11110', 'GreenHarvest Foods', 'PNQ', 'BKK', 'Pune', 'Bangkok', 'Food Products', 'Shelf-stable spice mixes in cartons', 9, 180.00, 60.00, 50.00, 40.00, 180.00, 180.00, 'Documents Pending', '2026-06-10', '2026-06-19', NULL, 3, 'Normal', 'Cargo declaration pending.', 2);

INSERT INTO shipment_milestones (booking_id, status, location, remarks, created_by, created_at) VALUES
(1, 'Booked', 'Mumbai', 'Booking created by operations team.', 1, '2026-05-01 09:30:00'),
(1, 'Delivered', 'Dubai', 'Delivered one day ahead of expected date.', 2, '2026-05-04 16:20:00'),
(2, 'Booked', 'Bengaluru', 'Cargo booked with customer confirmation.', 2, '2026-05-03 10:00:00'),
(2, 'In Transit', 'Bengaluru Airport', 'Cargo uplifted after warehouse handover.', 2, '2026-06-10 18:00:00'),
(3, 'Documents Pending', 'Delhi', 'Packing list correction requested.', 3, '2026-05-07 11:15:00'),
(4, 'Delayed', 'Hyderabad Airport', 'Capacity shortfall on booked sector.', 2, '2026-05-15 19:10:00'),
(8, 'Completed', 'Amsterdam', 'Shipment and payment closed.', 5, '2026-05-25 12:30:00'),
(9, 'Delayed', 'Kolkata', 'Carrier rolled cargo to next available flight.', 2, '2026-05-30 21:45:00'),
(14, 'In Transit', 'Hyderabad Airport', 'Flight departed as planned.', 2, '2026-06-10 06:40:00'),
(17, 'Delivered', 'Doha', 'Proof of delivery uploaded.', 4, '2026-06-10 14:05:00');

INSERT INTO documents (booking_id, document_type, status, file_name, remarks, verified_by) VALUES
(3, 'Airway Bill', 'Received', 'awb-orb-0003.pdf', 'Draft AWB received.', 3),
(3, 'Invoice', 'Verified', 'invoice-orb-0003.pdf', 'Commercial invoice verified.', 3),
(3, 'Packing List', 'Pending', NULL, 'Customer must correct package count.', NULL),
(3, 'Cargo Declaration', 'Pending', NULL, 'Required before dispatch.', NULL),
(4, 'Airway Bill', 'Verified', 'awb-orb-0004.pdf', 'Ready.', 3),
(4, 'Invoice', 'Verified', 'invoice-orb-0004.pdf', 'Ready.', 3),
(4, 'Packing List', 'Received', 'packing-orb-0004.pdf', 'Checked.', 3),
(4, 'Delivery Proof', 'Pending', NULL, 'Available after delivery.', NULL),
(12, 'Insurance Document', 'Pending', NULL, 'High-value electronics require insurance note.', NULL),
(12, 'Invoice', 'Verified', 'invoice-orb-0012.pdf', 'Verified.', 3),
(20, 'Cargo Declaration', 'Pending', NULL, 'Customer has not shared declaration.', NULL),
(20, 'Invoice', 'Received', 'invoice-orb-0020.pdf', 'Awaiting verification.', NULL),
(17, 'Delivery Proof', 'Verified', 'pod-orb-0017.pdf', 'Verified after delivery.', 3);

INSERT INTO payments (booking_id, quotation_amount, invoice_amount, paid_amount, balance_amount, payment_status, payment_date, payment_method, due_date) VALUES
(1, 126500.00, 128000.00, 128000.00, 0.00, 'Paid', '2026-05-04', 'Bank Transfer', '2026-05-08'),
(2, 84500.00, 87200.00, 45000.00, 42200.00, 'Partial', '2026-05-12', 'UPI', '2026-06-15'),
(3, 218000.00, 221400.00, 0.00, 221400.00, 'Overdue', NULL, NULL, '2026-06-08'),
(4, 96500.00, 98000.00, 20000.00, 78000.00, 'Overdue', '2026-05-10', 'Bank Transfer', '2026-05-20'),
(5, 176000.00, 182500.00, 0.00, 182500.00, 'Pending', NULL, NULL, '2026-06-18'),
(6, 151000.00, 154300.00, 60000.00, 94300.00, 'Partial', '2026-05-18', 'Cheque', '2026-06-17'),
(7, 104000.00, 107800.00, 0.00, 107800.00, 'Pending', NULL, NULL, '2026-06-22'),
(8, 189500.00, 192000.00, 192000.00, 0.00, 'Paid', '2026-05-24', 'Bank Transfer', '2026-05-28'),
(9, 210000.00, 216500.00, 50000.00, 166500.00, 'Overdue', '2026-05-23', 'Bank Transfer', '2026-06-05'),
(10, 76000.00, 78500.00, 0.00, 78500.00, 'Pending', NULL, NULL, '2026-06-16'),
(11, 119000.00, 121400.00, 0.00, 121400.00, 'Pending', NULL, NULL, '2026-06-20'),
(12, 99500.00, 101600.00, 20000.00, 81600.00, 'Partial', '2026-06-05', 'UPI', '2026-06-21'),
(13, 128500.00, 130000.00, 0.00, 130000.00, 'Pending', NULL, NULL, '2026-06-19'),
(14, 85000.00, 87500.00, 87500.00, 0.00, 'Paid', '2026-06-08', 'Bank Transfer', '2026-06-14'),
(15, 152000.00, 156000.00, 0.00, 156000.00, 'Pending', NULL, NULL, '2026-06-24'),
(16, 132000.00, 135500.00, 40000.00, 95500.00, 'Partial', '2026-06-08', 'Bank Transfer', '2026-06-20'),
(17, 98000.00, 101200.00, 101200.00, 0.00, 'Paid', '2026-06-10', 'UPI', '2026-06-12'),
(18, 173000.00, 178800.00, 0.00, 178800.00, 'Pending', NULL, NULL, '2026-06-23'),
(19, 89000.00, 91000.00, 0.00, 91000.00, 'Pending', NULL, NULL, '2026-06-25'),
(20, 67000.00, 69000.00, 0.00, 69000.00, 'Pending', NULL, NULL, '2026-06-23');

INSERT INTO airline_rates (airline_name, origin_airport, destination_airport, rate_per_kg, fuel_surcharge, handling_charge, valid_from, valid_to, notes) VALUES
('Emirates SkyCargo', 'BOM', 'DXB', 245.00, 18.00, 4500.00, '2026-06-01', '2026-07-31', 'Reliable daily uplift for pharma and retail cargo.'),
('Emirates SkyCargo', 'DEL', 'DXB', 252.00, 18.00, 4600.00, '2026-06-01', '2026-07-31', 'Buyer nominated option available.'),
('Qatar Airways Cargo', 'HYD', 'DOH', 238.00, 20.00, 4200.00, '2026-06-01', '2026-07-31', 'Good for perishable uplift.'),
('Singapore Airlines Cargo', 'BLR', 'SIN', 265.00, 16.00, 3900.00, '2026-06-01', '2026-07-15', 'Fast transit to Southeast Asia.'),
('Lufthansa Cargo', 'AMD', 'FRA', 285.00, 22.00, 5200.00, '2026-06-01', '2026-08-15', 'Preferred for European medical shipments.'),
('Cathay Cargo', 'MAA', 'HKG', 272.00, 19.00, 4100.00, '2026-06-01', '2026-07-31', 'Good electronics handling.'),
('KLM Cargo', 'COK', 'AMS', 298.00, 24.00, 5700.00, '2026-06-01', '2026-08-31', 'Weekly capacity varies.'),
('Thai Cargo', 'CCU', 'BKK', 210.00, 14.00, 3600.00, '2026-06-01', '2026-07-31', 'Competitive regional route.'),
('IndiGo CarGo', 'PNQ', 'DXB', 188.00, 12.00, 3000.00, '2026-06-01', '2026-07-31', 'Domestic connection subject to availability.'),
('British Airways World Cargo', 'DEL', 'LHR', 302.00, 26.00, 6100.00, '2026-06-01', '2026-08-31', 'Direct routing for textile and retail cargo.');

INSERT INTO complaints (booking_id, customer_name, title, status, priority, assigned_to) VALUES
(4, 'Fatima Ansari', 'Delay update requested for perishable shipment', 'In Review', 'High', 2),
(9, 'Manoj Das', 'Customer requested escalation for rolled cargo', 'Open', 'High', 2),
(12, 'Neha Iyer', 'Insurance document checklist confusion', 'Open', 'Normal', 3);

INSERT INTO notifications (title, message, type, severity, related_booking_id, created_at) VALUES
('Delayed shipment requires action', 'ORB-2026-0004 is delayed beyond the expected delivery date.', 'Shipment', 'Critical', 4, '2026-06-09 09:00:00'),
('Pending document reminder', 'ORB-2026-0003 still needs a corrected packing list.', 'Document', 'Warning', 3, '2026-06-09 09:05:00'),
('Payment overdue', 'ORB-2026-0009 has an overdue balance of INR 166500.00.', 'Payment', 'Critical', 9, '2026-06-10 09:00:00'),
('Delivery due tomorrow', 'ORB-2026-0010 is expected on 2026-06-12.', 'Reminder', 'Info', 10, '2026-06-11 09:00:00'),
('High priority booking pending', 'ORB-2026-0011 is high priority and still not dispatched.', 'Shipment', 'Warning', 11, '2026-06-11 09:05:00');

INSERT INTO chat_messages (user_id, role, message, metadata) VALUES
(1, 'user', 'Summarize delayed shipments.', JSON_OBJECT('source', 'seed')),
(1, 'assistant', 'There are delayed shipments requiring follow-up, led by ORB-2026-0004 and ORB-2026-0009. Check carrier capacity and customer updates first.', JSON_OBJECT('provider', 'rule-based'));
