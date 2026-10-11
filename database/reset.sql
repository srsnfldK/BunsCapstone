-- Running this will delete all tables and data
-- After running this file run schema.sql to rebuild tables

USE psdb;

DROP TABLE IF EXISTS recipe;
DROP TABLE IF EXISTS ingredient;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS users;