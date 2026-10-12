-- Test data for PantrySync Database
-- Run this file after schema.sql
-- Run reset.sql if schema.sql already has populated tables

USE psdb;

-- users table
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES
    ('Baker TEST', 'testbaker@email.com', 'hashtest1', 'user', TRUE),
    ('Manager TEST', 'testmanager@email.com', 'hashtest2', 'manager', TRUE),
    ('Unactive TEST', 'testunactive@email.com', 'hashtest3', 'user', FALSE);

-- inventory table
INSERT INTO inventory (name, description)
VALUES ('Inventory TEST', 'Test inventory');

-- ingredients table
INSERT INTO ingredient (inventory_id, name, unit, quantity, reorder_level, description)
VALUES
    (1, 'Flour TEST', 'kg', 20.00, 5.00, 'TEST -All-purpose flour'),
    (1, 'Sugar TEST', 'kg', 20.00, 5.00, 'TEST - Granulated sugar'),
    (1, 'Butter TEST', 'g', 1000.00, 100.00, 'TEST - Butter'),
    (1, 'Eggs TEST', 'count', 20, 30, 'TEST - Low stock');

-- recipes table
INSERT INTO recipe (name, description, instructions, servings, created_by)
VALUES
    ('Blueberry Muffins TEST', 'TEST - Blueberry muffin recipe', 'Place holder instructions', 16, 1),
    ('Chocolate Cake TEST', 'TEST - Chocolate recipe test', 'Place holder instructions', 1, 2);

-- recipe ingredient table
INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity, unit)
VALUES
    (1, 1, 0.50, 'kg'),
    (1, 2, 0.25, 'kg'),
    (1, 3, 100.00, 'g'),
    (1, 4, 2.00, 'count'),
    (2, 1, 0.40, 'kg');

-- inventory transaction table
INSERT INTO inventory_transaction (inventory_id, ingredient_id, user_id, type, quantity_change, notes)
VALUES
    (1, 1, 2, 'add', 20.00, 'TEST - Initial flour stock'),
    (1, 1, 1, 'use', -0.50, 'TEST - Used in Blueberry Muffins'),
    (1, 3, 1, 'use', -100.00, 'TEST - Used in Blueberry Muffins'),
    (1, 4, 1, 'use', -2.00, 'TEST - Used in Blueberry Muffins');

-- receipt table
INSERT INTO receipt (user_id, inventory_id, image_url, status, total)
VALUES
    (1, 1, 'receiptTEST1.jpg', 'pending', 10.00),
    (1, 1, 'receiptTEST2.jpg', 'confirmed', 20.00);

-- notification
INSERT INTO notification (user_id, ingredient_id, message, type, is_read)
VALUES
    (2, 4, 'TEST - Eggs are running low', 'low_stock', FALSE),
    (1, 4, 'TEST - Eggs are running low', 'low_stock', TRUE);