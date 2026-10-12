---- Setup Instructions for PantrySync Database ----
1. Install MySQL Workbench and Server

2. After install, in Workbench, connect to 127.0.0.1 as root.

3. Run:
    CREATE DATABASE psdb;

4. Run files in the database folder in order:
    reset.sql (ONLY IF YOU HAVE CREATED AND POPULATED DATABASE BEFORE)
    schema.sql
    testdata.sql
