# Lab 03 – REST API, Query Parameters, Validation and Debugging
**Course:** Backend Development Fundamentals

---

## Student Information

- **Student Name:** Pasupuleti Shalini
- **Registration / Roll No:** 252U1R1185
- **Class & Section:** CSE-2D (214)

---

## 1. Objective

The primary objectives of Lab 03 are:
1. **RESTful API Architecture:** Design and implement noun-based resource endpoints mapped to standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
2. **Query Parameters & Search:** Implement query parameter handling on `GET /books` to support partial string searches on book titles using SQL `LIKE` (`search_q`).
3. **Sorting & Column Allowlisting:** Implement sorting (`order_by` and `order`) while protecting against SQL injection by validating columns against a strict allowlist.
4. **Pagination:** Implement pagination using `limit` and `offset` with integer boundary validation.
5. **Numeric Range Filtering:** Implement price range filtering using `min_price` and `max_price` with boundary checks (`min_price <= max_price`).
6. **Input Validation:** Enforce strict request body validation on `POST` and `PUT` endpoints, rejecting missing fields or non-numeric prices with HTTP `400 Bad Request`.
7. **Consistent Response Format:** Standardize all API error responses in a uniform `{ "message": "..." }` JSON format.
8. **Practical Backend Debugging:** Document and understand four common real-world backend defects:
   - `EADDRINUSE` port conflicts.
   - Incorrect module import paths (`MODULE_NOT_FOUND`).
   - Table name typos causing `SQLITE_ERROR: no such table`.
   - Missing `await` keywords in asynchronous database calls.

---

## 2. Technologies Used

- **Runtime Environment:** [Node.js](https://nodejs.org/) (v24.x)
- **Framework:** [Express.js](https://expressjs.com/) (v5.x)
- **Database:** SQLite3
- **Libraries:**
  - `sqlite`: Promise-based SQLite client wrapper for Node.js
  - `sqlite3`: Native SQLite3 driver bindings
  - `nodemon`: Development tool for automatic server restarts
- **API Testing:** Postman & Node.js Automated Test Suite

---

## 3. Project Structure

```text
Backend_Development_Fundamentals/
└── lab-03/
    ├── database/
    │   ├── books.db                    # SQLite database containing the book table
    │   └── schema.sql                  # Schema definition and 10 canonical sample records
    ├── screenshots/                    # Output screenshots for submission
    │   ├── 01-get-all-books-default.png
    │   ├── 02-search-title-like.png
    │   ├── 03-sort-price-desc.png
    │   ├── 04-sort-title-asc.png
    │   ├── 05-pagination-limit-offset.png
    │   ├── 06-price-range-min-max.png
    │   ├── 07-price-min-only.png
    │   ├── 08-price-max-only.png
    │   ├── 09-invalid-order-by.png
    │   ├── 10-invalid-order-direction.png
    │   ├── 11-invalid-limit.png
    │   ├── 12-invalid-price-range-min-gt-max.png
    │   ├── 13-invalid-price-format.png
    │   ├── 14-get-single-book-success.png
    │   ├── 15-get-single-book-not-found.png
    │   ├── 16-post-book-success.png
    │   ├── 17a-post-missing-title.png
    │   ├── 17b-post-missing-author.png
    │   ├── 17c-post-non-numeric-price.png
    │   ├── 18-put-book-success.png
    │   └── 19-delete-book-success.png
    ├── .gitignore                      # Excludes node_modules, tools/, and .env
    ├── Lab-03-Postman-Collection.json  # Importable Postman v2.1 test collection
    ├── package.json                    # Project metadata, dependencies, and npm scripts
    ├── package-lock.json               # Dependency lockfile
    ├── README.md                       # Comprehensive documentation & debugging guide
    ├── server.js                       # Express server with query filtering & validation
    └── test-endpoints.js               # Automated 21-case test runner
```

---

## 4. Installation & Setup

1. Open PowerShell and navigate to `lab-03`:
   ```powershell
   cd d:\Backend_Development_Fundamentals\lab-03
   ```

2. Install dependencies:
   ```powershell
   npm.cmd install
   ```

---

## 5. Database Schema & Canonical Records

The `book` table is defined in [`database/schema.sql`](file:///d:/Backend_Development_Fundamentals/lab-03/database/schema.sql):

```sql
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);
```

### Initial Canonical Records (10 Books):
1. *To Kill a Mockingbird* | Harper Lee | ₹399 | 281 pages
2. *1984* | George Orwell | ₹299 | 328 pages
3. *The Great Gatsby* | F. Scott Fitzgerald | ₹349 | 180 pages
4. *Pride and Prejudice* | Jane Austen | ₹250 | 279 pages
5. *The Catcher in the Rye* | J.D. Salinger | ₹320 | 234 pages
6. *The Hobbit* | J.R.R. Tolkien | ₹499 | 310 pages
7. *Fahrenheit 451* | Ray Bradbury | ₹280 | 256 pages
8. *Crime and Punishment* | Fyodor Dostoevsky | ₹450 | 671 pages
9. *The Alchemist* | Paulo Coelho | ₹199 | 208 pages
10. *Brave New World* | Aldous Huxley | ₹350 | 311 pages

---

## 6. Execution Commands

### 6.1 Start in Development Mode (with `nodemon`)
```powershell
npm.cmd run dev
```

### 6.2 Start in Standard Mode
```powershell
npm.cmd start
```

### 6.3 Run Automated Test Suite
```powershell
npm.cmd test
```

---

## 7. Endpoint Documentation & Query Parameters

### 7.1 Routes Overview

| # | HTTP Method | Endpoint URL | Description | Expected Status |
| :-: | :--- | :--- | :--- | :--- |
| **0** | `GET` | `/` | API status and student details | `200 OK` |
| **1** | `GET` | `/books/` | Retrieve books with optional query filtering | `200 OK` / `400 Bad Request` |
| **2** | `GET` | `/books/:bookId/` | Retrieve a single book by ID | `200 OK` / `404 Not Found` |
| **3** | `POST` | `/books/` | Add a new book (with strict payload validation) | `201 Created` / `400 Bad Request` |
| **4** | `PUT` | `/books/:bookId/` | Update an existing book's details | `200 OK` / `400 Bad Request` / `404 Not Found` |
| **5** | `DELETE`| `/books/:bookId/` | Remove a book by ID | `200 OK` / `404 Not Found` |

---

### 7.2 Query Parameters Supported on `GET /books/`

| Parameter | Type | Default | Description & Validation Rules |
| :--- | :--- | :---: | :--- |
| `search_q` | String | `""` | Partial title search using SQL `LIKE ?` with `%${search_q}%`. Default empty string returns all books. |
| `order_by` | String | `"id"` | Column name to sort by. Must be in allowlist: `id`, `title`, `author`, `price`, `pages`. Invalid values return `400`. |
| `order` | String | `"ASC"` | Sort direction. Must be either `ASC` or `DESC` (case-insensitive). Invalid values return `400`. |
| `limit` | Integer | `10` | Maximum number of records to return. Must be a positive integer (`> 0`). Invalid values return `400`. |
| `offset` | Integer | `0` | Number of records to skip for pagination. Must be a non-negative integer (`>= 0`). Invalid values return `400`. |
| `min_price` | Number | *None* | Minimum price filter (`price >= min_price`). Must be non-negative number (`>= 0`). Invalid values return `400`. |
| `max_price` | Number | *None* | Maximum price filter (`price <= max_price`). Must be non-negative number (`>= 0`). Invalid values return `400`. |

> [!IMPORTANT]
> When both `min_price` and `max_price` are supplied, the server validates `min_price <= max_price`. If `min_price > max_price`, an HTTP `400 Bad Request` is returned with `{ "message": "Invalid price range: min_price cannot be greater than max_price." }`.

---

## 8. Sample Requests & Responses

### 8.1 Successful Filtered Search: `GET /books/?search_q=The&order_by=price&order=DESC`
**Status:** `200 OK`
```json
[
  {
    "id": 6,
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "price": 499,
    "pages": 310
  },
  {
    "id": 3,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "price": 349,
    "pages": 180
  },
  {
    "id": 5,
    "title": "The Catcher in the Rye",
    "author": "J.D. Salinger",
    "price": 320,
    "pages": 234
  },
  {
    "id": 9,
    "title": "The Alchemist",
    "author": "Paulo Coelho",
    "price": 199,
    "pages": 208
  }
]
```

### 8.2 Validation Error: `GET /books/?min_price=500&max_price=200`
**Status:** `400 Bad Request`
```json
{
  "message": "Invalid price range: min_price cannot be greater than max_price."
}
```

### 8.3 POST New Book: `POST /books/`
**Request Body:**
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 650,
  "pages": 464
}
```
**Status:** `201 Created`
```json
{
  "message": "Book added successfully",
  "book": {
    "id": 11,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "price": 650,
    "pages": 464
  }
}
```

---

## 9. Sequential Postman Testing & Screenshot Capture Protocol

This section details the 19 individual Postman test requests and the exact screenshot requirements for each.

| # | Request Name | Method & URL | Body | Expected Status | Screenshot Filename |
| :-: | :--- | :--- | :--- | :-: | :--- |
| **01** | GET All Books (Default) | `GET http://localhost:3000/books/` | None | `200 OK` | `01-get-all-books-default.png` |
| **02** | Search Title LIKE | `GET http://localhost:3000/books/?search_q=The` | None | `200 OK` | `02-search-title-like.png` |
| **03** | Sort Price DESC | `GET http://localhost:3000/books/?order_by=price&order=DESC` | None | `200 OK` | `03-sort-price-desc.png` |
| **04** | Sort Title ASC | `GET http://localhost:3000/books/?order_by=title&order=ASC` | None | `200 OK` | `04-sort-title-asc.png` |
| **05** | Pagination (Limit & Offset) | `GET http://localhost:3000/books/?limit=3&offset=2` | None | `200 OK` | `05-pagination-limit-offset.png` |
| **06** | Price Range Filter | `GET http://localhost:3000/books/?min_price=250&max_price=400` | None | `200 OK` | `06-price-range-min-max.png` |
| **07** | Price Min Only | `GET http://localhost:3000/books/?min_price=400` | None | `200 OK` | `07-price-min-only.png` |
| **08** | Price Max Only | `GET http://localhost:3000/books/?max_price=300` | None | `200 OK` | `08-price-max-only.png` |
| **09** | Invalid order_by Column | `GET http://localhost:3000/books/?order_by=invalid_column` | None | `400 Bad Request` | `09-invalid-order-by.png` |
| **10** | Invalid order Direction | `GET http://localhost:3000/books/?order=REVERSE` | None | `400 Bad Request` | `10-invalid-order-direction.png` |
| **11** | Invalid Limit | `GET http://localhost:3000/books/?limit=-5` | None | `400 Bad Request` | `11-invalid-limit.png` |
| **12** | Invalid Price Range (min > max) | `GET http://localhost:3000/books/?min_price=500&max_price=200` | None | `400 Bad Request` | `12-invalid-price-range-min-gt-max.png` |
| **13** | Invalid Price Format | `GET http://localhost:3000/books/?min_price=abc` | None | `400 Bad Request` | `13-invalid-price-format.png` |
| **14** | GET Single Book (Success) | `GET http://localhost:3000/books/1/` | None | `200 OK` | `14-get-single-book-success.png` |
| **15** | GET Single Book (Not Found) | `GET http://localhost:3000/books/999/` | None | `404 Not Found` | `15-get-single-book-not-found.png` |
| **16** | POST Create Book (Success) | `POST http://localhost:3000/books/` | `{"title":"Clean Code","author":"Robert C. Martin","price":650,"pages":464}` | `201 Created` | `16-post-book-success.png` |
| **17a** | POST Validation: Missing Title | `POST http://localhost:3000/books/` | `{"author":"Robert C. Martin","price":650,"pages":464}` | `400 Bad Request` | `17a-post-missing-title.png` |
| **17b** | POST Validation: Missing Author | `POST http://localhost:3000/books/` | `{"title":"Clean Code","price":650,"pages":464}` | `400 Bad Request` | `17b-post-missing-author.png` |
| **17c** | POST Validation: Non-Numeric Price | `POST http://localhost:3000/books/` | `{"title":"Clean Code","author":"Robert C. Martin","price":"not-a-number","pages":464}` | `400 Bad Request` | `17c-post-non-numeric-price.png` |
| **18** | PUT Update Book (Success) | `PUT http://localhost:3000/books/{{bookId}}/` | `{"title":"Clean Code: Second Edition","author":"Robert C. Martin","price":750,"pages":464}` | `200 OK` | `18-put-book-success.png` |
| **19** | DELETE Book (Success) | `DELETE http://localhost:3000/books/{{bookId}}/` | None | `200 OK` | `19-delete-book-success.png` |

---

## 10. Output Screenshots

### Screenshot 1: GET All Books (Default)
![GET All Books Default](screenshots/01-get-all-books-default.png)

### Screenshot 2: Search Title LIKE (`search_q=The`)
![Search Title LIKE](screenshots/02-search-title-like.png)

### Screenshot 3: Sort Price DESC
![Sort Price DESC](screenshots/03-sort-price-desc.png)

### Screenshot 4: Sort Title ASC
![Sort Title ASC](screenshots/04-sort-title-asc.png)

### Screenshot 5: Pagination (`limit=3&offset=2`)
![Pagination](screenshots/05-pagination-limit-offset.png)

### Screenshot 6: Price Range (`min_price=250&max_price=400`)
![Price Range](screenshots/06-price-range-min-max.png)

### Screenshot 7: Price Min Only (`min_price=400`)
![Price Min Only](screenshots/07-price-min-only.png)

### Screenshot 8: Price Max Only (`max_price=300`)
![Price Max Only](screenshots/08-price-max-only.png)

### Screenshot 9: Invalid `order_by` Column (400)
![Invalid order_by](screenshots/09-invalid-order-by.png)

### Screenshot 10: Invalid `order` Direction (400)
![Invalid order](screenshots/10-invalid-order-direction.png)

### Screenshot 11: Invalid `limit` (400)
![Invalid limit](screenshots/11-invalid-limit.png)

### Screenshot 12: Invalid Price Range (`min_price > max_price`) (400)
![Invalid Price Range](screenshots/12-invalid-price-range-min-gt-max.png)

### Screenshot 13: Invalid Price Format (400)
![Invalid Price Format](screenshots/13-invalid-price-format.png)

### Screenshot 14: GET Single Book (200 OK)
![GET Single Book](screenshots/14-get-single-book-success.png)

### Screenshot 15: GET Single Book (404 Not Found)
![GET Single Book 404](screenshots/15-get-single-book-not-found.png)

### Screenshot 16: POST Create Book (201 Created)
![POST Book Success](screenshots/16-post-book-success.png)

### Screenshot 17a: POST Validation: Missing Title (400 Bad Request)
![POST Missing Title](screenshots/17a-post-missing-title.png)

### Screenshot 17b: POST Validation: Missing Author (400 Bad Request)
![POST Missing Author](screenshots/17b-post-missing-author.png)

### Screenshot 17c: POST Validation: Non-Numeric Price (400 Bad Request)
![POST Non-Numeric Price](screenshots/17c-post-non-numeric-price.png)

### Screenshot 18: PUT Update Book (200 OK)
![PUT Book Success](screenshots/18-put-book-success.png)

### Screenshot 19: DELETE Book (200 OK)
![DELETE Book Success](screenshots/19-delete-book-success.png)

---

## 11. Debugging Exercises: Common Backend Errors & Solutions

### Exercise 1: `EADDRINUSE` Port Conflict

#### Scenario & Error Log:
When attempting to start the server via `node server.js`, the process crashes with:
```text
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1898:16)
    at listenInCluster (node:net:1955:12)
    at Server.listen (node:net:2054:7)
```

#### Cause:
Port `3000` is already held open by another background Node.js process, a hanging server, or another service running on the host operating system.

#### Diagnosis & Fix:
1. **Find the PID occupying port 3000:**
   ```powershell
   netstat -ano | findstr :3000
   ```
   *(Example output: `TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    14220`)*
2. **Terminate the hanging process:**
   ```powershell
   taskkill /PID 14220 /F
   ```
3. **Preventive Code Fix:** Make the port dynamic by reading `process.env.PORT` before defaulting:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

---

### Exercise 2: Incorrect Module Import Path (`MODULE_NOT_FOUND`)

#### Scenario & Error Log:
Running the server produces:
```text
node:internal/modules/cjs/loader:1225
  throw err;
  ^
Error: Cannot find module './database/db'
Require stack:
- D:\Backend_Development_Fundamentals\lab-03\server.js
  code: 'MODULE_NOT_FOUND'
```

#### Cause:
Node.js CommonJS `require()` could not locate the file because of an incorrect relative path, misspelled filename, or wrong file extension.

#### Diagnosis & Fix:
1. Inspect the directory tree: verify that the target file is at `database/books.db` or `database/schema.sql`, not `database/db.js`.
2. Ensure relative path starts with `./` (for current directory) or `../` (for parent directory).
3. If importing a native database file, use `path.join(__dirname, 'database', 'books.db')` rather than `require()`.

---

### Exercise 3: Table Name Typo (`SQLITE_ERROR: no such table`)

#### Scenario & Error Log:
An API request to `GET /books/` triggers:
```text
Database query error: SQLITE_ERROR: no such table: books
    at Database.<anonymous> (node_modules/sqlite3/lib/sqlite3.js:324:21)
```

#### Cause:
The SQL query was written with a plural table name (`SELECT * FROM books`), but the table was defined in singular form (`CREATE TABLE book`) in `database/schema.sql`.

#### Diagnosis & Fix:
1. Run SQLite CLI to inspect the database schema:
   ```powershell
   .\tools\sqlite3.exe database/books.db ".schema"
   ```
2. Correct the SQL query string in `server.js` to match the exact schema name:
   ```javascript
   // Correct singular table name
   const getBooksQuery = `SELECT * FROM book WHERE ...`;
   ```

---

### Exercise 4: Missing `await` in Asynchronous Database Operations

#### Scenario & Error Log:
The endpoint returns an empty array or crashes with unhandled promise warnings:
```javascript
// BUGGY CODE:
app.get('/books', async (req, res) => {
  const books = db.all('SELECT * FROM book'); // MISSING await!
  res.status(200).json(books);
});
```
The client receives `"{}"` (an empty serialized Promise) instead of the list of books, and `books.length` evaluates to `undefined`.

#### Cause:
SQLite operations (`db.all()`, `db.get()`, `db.run()`, `open()`) return JavaScript `Promise` objects. Omitting `await` causes Express to respond immediately with the pending Promise object before the SQL query has resolved.

#### Diagnosis & Fix:
Always use `await` before asynchronous database calls inside an `async` route handler:
```javascript
// CORRECT CODE:
app.get('/books', async (req, res) => {
  try {
    const books = await db.all('SELECT * FROM book');
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

