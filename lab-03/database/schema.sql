-- =============================================================================
-- Lab 03: SQLite Database Schema & Sample Data
-- Database: database/books.db
-- Table: book
-- =============================================================================

CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

-- Insert 10 meaningful sample book records
INSERT INTO book (title, author, price, pages) VALUES ('To Kill a Mockingbird', 'Harper Lee', 399, 281);
INSERT INTO book (title, author, price, pages) VALUES ('1984', 'George Orwell', 299, 328);
INSERT INTO book (title, author, price, pages) VALUES ('The Great Gatsby', 'F. Scott Fitzgerald', 349, 180);
INSERT INTO book (title, author, price, pages) VALUES ('Pride and Prejudice', 'Jane Austen', 250, 279);
INSERT INTO book (title, author, price, pages) VALUES ('The Catcher in the Rye', 'J.D. Salinger', 320, 234);
INSERT INTO book (title, author, price, pages) VALUES ('The Hobbit', 'J.R.R. Tolkien', 499, 310);
INSERT INTO book (title, author, price, pages) VALUES ('Fahrenheit 451', 'Ray Bradbury', 280, 256);
INSERT INTO book (title, author, price, pages) VALUES ('Crime and Punishment', 'Fyodor Dostoevsky', 450, 671);
INSERT INTO book (title, author, price, pages) VALUES ('The Alchemist', 'Paulo Coelho', 199, 208);
INSERT INTO book (title, author, price, pages) VALUES ('Brave New World', 'Aldous Huxley', 350, 311);

