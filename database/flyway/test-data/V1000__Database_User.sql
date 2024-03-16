-- Create a user with read/write access to the tables, but not to the schema

CREATE USER pile_user WITH PASSWORD 'password';
GRANT CONNECT ON DATABASE postgres TO pile_user;
GRANT USAGE ON SCHEMA pile TO pile_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pile TO pile_user;

