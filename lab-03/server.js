// =============================================================================
// Lab 03: REST API, Query Parameters, Validation and Debugging
// File: server.js
// Student: Pasupuleti Shalini | 252U1R1185 | CSE-2D (214)
// =============================================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Server port configuration
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'database', 'books.db');
const schemaPath = path.join(__dirname, 'database', 'schema.sql');

let db = null;

// Allowlist for sorting columns
const ALLOWED_ORDER_BY_COLUMNS = ['id', 'title', 'author', 'price', 'pages'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

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

    // Auto-seed initial table and records if table doesn't exist
    const tableCheck = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='book';"
    );
    if (!tableCheck) {
      console.log('Initializing database schema and inserting initial 10 records...');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await db.exec(schemaSql);
        console.log('Database schema and sample data initialized successfully.');
      }
    }

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
        message: `Database connection failed: ${err.message}`
      });
    }
  }
  next();
});

// =============================================================================
// Routes
// =============================================================================

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 03 - REST API, Query Parameters, Validation and Debugging',
    student: {
      name: 'Pasupuleti Shalini',
      registrationNumber: '252U1R1185',
      section: 'CSE-2D (214)'
    },
    endpoints: {
      getAllBooks: 'GET /books?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=',
      getSingleBook: 'GET /books/:bookId',
      createBook: 'POST /books',
      updateBook: 'PUT /books/:bookId',
      deleteBook: 'DELETE /books/:bookId'
    }
  });
});

// -----------------------------------------------------------------------------
// 1. GET /books - Retrieve books with search, sort, pagination, and price range
// -----------------------------------------------------------------------------
app.get(['/books', '/books/'], async (req, res) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0',
      min_price,
      max_price
    } = req.query;

    // 1. Validate order_by against allowlist
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!ALLOWED_ORDER_BY_COLUMNS.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid order_by column. Allowed columns: ${ALLOWED_ORDER_BY_COLUMNS.join(', ')}`
      });
    }

    // 2. Validate order direction against allowlist
    const normalizedOrder = String(order).toUpperCase();
    if (!ALLOWED_ORDER_DIRECTIONS.includes(normalizedOrder)) {
      return res.status(400).json({
        message: `Invalid order direction. Allowed values: ${ALLOWED_ORDER_DIRECTIONS.join(', ')}`
      });
    }

    // 3. Validate limit (positive integer > 0)
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: 'Invalid limit: must be a positive integer.'
      });
    }

    // 4. Validate offset (non-negative integer >= 0)
    const parsedOffset = Number(offset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: 'Invalid offset: must be a non-negative integer.'
      });
    }

    // 5. Validate price range filters
    let parsedMinPrice = null;
    let parsedMaxPrice = null;

    if (min_price !== undefined) {
      parsedMinPrice = Number(min_price);
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({
          message: 'Invalid min_price: must be a valid non-negative number.'
        });
      }
    }

    if (max_price !== undefined) {
      parsedMaxPrice = Number(max_price);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({
          message: 'Invalid max_price: must be a valid non-negative number.'
        });
      }
    }

    if (parsedMinPrice !== null && parsedMaxPrice !== null) {
      if (parsedMinPrice > parsedMaxPrice) {
        return res.status(400).json({
          message: 'Invalid price range: min_price cannot be greater than max_price.'
        });
      }
    }

    // Build parameterized query conditions
    const conditions = [];
    const params = [];

    // Search query filter (LIKE partial match)
    if (search_q) {
      conditions.push('title LIKE ?');
      params.push(`%${search_q}%`);
    }

    // Price range conditions
    if (parsedMinPrice !== null && parsedMaxPrice !== null) {
      conditions.push('price BETWEEN ? AND ?');
      params.push(parsedMinPrice, parsedMaxPrice);
    } else if (parsedMinPrice !== null) {
      conditions.push('price >= ?');
      params.push(parsedMinPrice);
    } else if (parsedMaxPrice !== null) {
      conditions.push('price <= ?');
      params.push(parsedMaxPrice);
    }

    let query = 'SELECT * FROM book';
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Safe injection of allowlisted SQL identifiers
    query += ` ORDER BY ${normalizedOrderBy} ${normalizedOrder}`;
    query += ` LIMIT ? OFFSET ?;`;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(query, params);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 2. GET /books/:bookId - Retrieve a single book by ID
// -----------------------------------------------------------------------------
app.get(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ message: `Book with ID ${bookId} not found` });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------------------------------------------------------
// Helper: Validate book body payload for POST and PUT
// -----------------------------------------------------------------------------
function validateBookPayload(body) {
  const { title, author, price, pages } = body;

  if (title === undefined || typeof title !== 'string' || title.trim() === '') {
    return 'Missing or invalid title: title must be a non-empty string.';
  }

  if (author === undefined || typeof author !== 'string' || author.trim() === '') {
    return 'Missing or invalid author: author must be a non-empty string.';
  }

  if (price === undefined || typeof price !== 'number' || isNaN(price) || price < 0) {
    return 'Missing or invalid price: price must be a non-negative number.';
  }

  if (pages === undefined || !Number.isInteger(pages) || pages <= 0) {
    return 'Missing or invalid pages: pages must be a positive integer.';
  }

  return null;
}

// -----------------------------------------------------------------------------
// 3. POST /books - Insert a new book record
// -----------------------------------------------------------------------------
app.post(['/books', '/books/'], async (req, res) => {
  try {
    const validationError = validateBookPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, author, price, pages } = req.body;
    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(insertBookQuery, [title.trim(), author.trim(), price, pages]);

    const newBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [result.lastID]);

    res.status(201).json({
      message: 'Book added successfully',
      book: newBook
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 4. PUT /books/:bookId - Update an existing book record
// -----------------------------------------------------------------------------
app.put(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;

    // Verify book exists
    const existingBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: `Book with ID ${bookId} not found` });
    }

    const validationError = validateBookPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, author, price, pages } = req.body;
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [title.trim(), author.trim(), price, pages, bookId]);

    const updatedBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);

    res.status(200).json({
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 5. DELETE /books/:bookId - Delete a book by ID
// -----------------------------------------------------------------------------
app.delete(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;

    // Verify book exists
    const existingBook = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: `Book with ID ${bookId} not found` });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: `Book with ID ${bookId} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------------------------------------------------------
// Fallback 404 Route for Unmatched Endpoints
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ message: '404 Not Found: The requested route does not exist.' });
});

// Export app for testing and execution
module.exports = app;

