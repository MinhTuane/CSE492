-- Migration script to add OrderItem table for proper quantity support
-- This fixes the critical accessories quantity bug

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'MOTORCYCLE' or 'ACCESSORY'
    item_id VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DOUBLE NOT NULL,
    total_price DOUBLE NOT NULL,
    original_unit_price DOUBLE,
    discount_percentage DOUBLE,
    item_name VARCHAR(255),
    item_brand VARCHAR(255),
    item_model VARCHAR(255),
    item_category VARCHAR(255),
    item_image_url TEXT,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_item_type (item_type),
    INDEX idx_item_id (item_id)
);

-- Migrate existing orders to use order_items
-- For motorcycles
INSERT INTO order_items (id, order_id, item_type, item_id, quantity, unit_price, total_price, original_unit_price, discount_percentage, item_name, item_brand, item_model, item_category)
SELECT 
    CONCAT(UUID(), '-', om.motorcycle_id) as id,
    om.order_id,
    'MOTORCYCLE' as item_type,
    om.motorcycle_id as item_id,
    1 as quantity, -- Assume quantity 1 for existing orders
    CASE 
        WHEN m.discount_percentage > 0 THEN m.price * (1 - m.discount_percentage / 100)
        ELSE m.price
    END as unit_price,
    CASE 
        WHEN m.discount_percentage > 0 THEN m.price * (1 - m.discount_percentage / 100)
        ELSE m.price
    END as total_price,
    m.price as original_unit_price,
    m.discount_percentage,
    m.model as item_name,
    m.brand as item_brand,
    m.model as item_model,
    m.category as item_category
FROM order_motorcycles om
JOIN motorcycles m ON om.motorcycle_id = m.id
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.id = om.order_id);

-- For accessories
INSERT INTO order_items (id, order_id, item_type, item_id, quantity, unit_price, total_price, item_name, item_brand, item_category, item_image_url)
SELECT 
    CONCAT(UUID(), '-', oa.accessory_id) as id,
    oa.order_id,
    'ACCESSORY' as item_type,
    oa.accessory_id as item_id,
    1 as quantity, -- Assume quantity 1 for existing orders
    a.price as unit_price,
    a.price as total_price,
    a.name as item_name,
    a.brand as item_brand,
    a.category as item_category,
    a.image_url as item_image_url
FROM order_accessories oa
JOIN accessories a ON oa.accessory_id = a.id
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.id = oa.order_id);

-- Note: We keep the old order_motorcycles and order_accessories tables for backward compatibility
-- They are marked as @Deprecated in the Order entity
-- New orders will use order_items table exclusively
