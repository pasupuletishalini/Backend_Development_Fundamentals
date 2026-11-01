// =============================================================================
// Lab 02: SQLite Database and CRUD Routes
// File: server.js
// Student: Pasupuleti Shalini | 252U1R1185 | CSE-2D (214)
// =============================================================================

const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Server port configuration (Render assigns process.env.PORT dynamically)
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'database', 'books.db');

let db = null;

// =============================================================================
// Database & Server Initialization Function
// =============================================================================
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connected successfully.');

    // Start Express server only when executed directly (not when required by tests)
    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`Express server is running at http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

// Initialize database and start server
initializeDBAndServer();

// Middleware to ensure DB connection is ready before handling requests
app.use(async (req, res, next) => {
  if (!db) {
    try {
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
    } catch (err) {
      return res.status(500).json({
        error: 'Database connection failed',
        message: err.message
      });
    }
  }
  next();
});

// =============================================================================
// CRUD API Routes
// =============================================================================

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 02 - SQLite Database and CRUD API',
    student: {
      name: 'Pasupuleti Shalini',
      registrationNumber: '252U1R1185',
      section: 'CSE-2D (214)'
    },
    endpoints: {
      getAllBooks: 'GET /books/',
      getSingleBook: 'GET /books/:bookId/',
      createBook: 'POST /books/',
      updateBook: 'PUT /books/:bookId/',
      deleteBook: 'DELETE /books/:bookId/'
    }
  });
});

// -----------------------------------------------------------------------------
// 1. GET /books/ - Retrieve all books
// -----------------------------------------------------------------------------
app.get(['/books', '/books/'], async (req, res) => {
  try {
    const getBooksQuery = `SELECT * FROM book ORDER BY id ASC;`;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// 2. GET /books/:bookId/ - Retrieve a single book by ID
// -----------------------------------------------------------------------------
app.get(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found` });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// 3. POST /books/ - Insert a new book
// -----------------------------------------------------------------------------
app.post(['/books', '/books/'], async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate required fields
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: title, author, price, and pages are required.'
      });
    }

    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(insertBookQuery, [title, author, price, pages]);

    // Retrieve the newly created record
    const newBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [result.lastID]);

    res.status(201).json({
      message: 'Book added successfully',
      book: newBook
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// 4. PUT /books/:bookId/ - Update an existing book
// -----------------------------------------------------------------------------
app.put(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    // Validate required fields
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: title, author, price, and pages are required.'
      });
    }

    // Verify book exists
    const existingBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);
    if (!existingBook) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found` });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [title, author, price, pages, bookId]);

    const updatedBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);

    res.status(200).json({
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// 5. DELETE /books/:bookId/ - Delete a book by ID
// -----------------------------------------------------------------------------
app.delete(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;

    // Verify book exists
    const existingBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);
    if (!existingBook) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found` });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: `Book with ID ${bookId} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// Fallback 404 Route for Unmatched Endpoints
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: '404 Not Found: The requested route does not exist.' });
});

// Export app for testing and serverless deployment
module.exports = app;
