-- Test data for PantrySync Database
-- Run this file after schema.sql
-- Run reset.sql if scehma.sql already has populated tables

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