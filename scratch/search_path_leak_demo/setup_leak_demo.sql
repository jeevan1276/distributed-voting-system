-- Run this against your voting_system database:
--   psql -U postgres -d voting_system -f setup_leak_demo.sql

CREATE SCHEMA IF NOT EXISTS tenant_a;
CREATE SCHEMA IF NOT EXISTS tenant_b;

CREATE TABLE IF NOT EXISTS tenant_a.users (
    id SERIAL PRIMARY KEY,
    email TEXT
);

CREATE TABLE IF NOT EXISTS tenant_b.users (
    id SERIAL PRIMARY KEY,
    email TEXT
);

-- Distinct, obviously-different data so a leak is unmistakable
INSERT INTO tenant_a.users (email) VALUES ('alice@tenant-a.com');
INSERT INTO tenant_b.users (email) VALUES ('bob@tenant-b.com');
