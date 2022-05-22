CREATE SCHEMA qlik;
CREATE TABLE qlik.message(id uuid PRIMARY KEY, text text NOT NULL, palindrome BOOLEAN NOT NULL);