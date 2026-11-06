// =============================================================================
// Comprehensive Automated Test Suite for Lab 03 Endpoints & Query Parameters
// File: test-endpoints.js
// Student: Pasupuleti Shalini | 252U1R1185 | CSE-2D (214)
// =============================================================================

const http = require('http');
const app = require('./server');

const TEST_PORT = 3002;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) { }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING LAB 03 COMPREHENSIVE ENDPOINT & QUERY TESTS ===\n');

  let server;
  let createdBookId = null;
  let testFailed = false;

  try {
    // Start temporary test server instance
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`Test server running at http://127.0.0.1:${TEST_PORT}\n`);
        resolve();
      });
    });

    // Test 1: GET /books (default parameters: limit 10, offset 0, order_by id ASC)
    console.log('--- TEST 1: GET /books (Default params) ---');
    const res1 = await request('GET', '/books');
    console.log(`Status: ${res1.statusCode} | Body:`, res1.body);
    if (res1.statusCode !== 200 || !Array.isArray(res1.body) || res1.body.length !== 10) {
      throw new Error(`Test 1 Failed: Expected 200 with 10 books, got ${res1.statusCode}: ${JSON.stringify(res1.body)}`);
    }
    console.log('Result: PASS\n');

    // Test 2: Search with LIKE (search_q=The)
    console.log('--- TEST 2: GET /books?search_q=The (Search via LIKE) ---');
    const res2 = await request('GET', '/books?search_q=The');
    console.log(`Status: ${res2.statusCode} | Matches found: ${res2.body.length}`);
    const allMatch = res2.body.every(b => b.title.toLowerCase().includes('the'));
    if (res2.statusCode !== 200 || !allMatch || res2.body.length === 0) {
      throw new Error(`Test 2 Failed: Search results do not match 'The'`);
    }
    console.log('Sample matched titles:', res2.body.map(b => b.title));
    console.log('Result: PASS\n');

    // Test 3: Sort by price DESC
    console.log('--- TEST 3: GET /books?order_by=price&order=DESC (Sort price DESC) ---');
    const res3 = await request('GET', '/books?order_by=price&order=DESC');
    console.log(`Status: ${res3.statusCode}`);
    const prices = res3.body.map(b => b.price);
    console.log('Prices retrieved:', prices);
    const isSortedDesc = prices.slice(1).every((p, i) => prices[i] >= p);
    if (res3.statusCode !== 200 || !isSortedDesc) {
      throw new Error(`Test 3 Failed: Prices not properly sorted DESC`);
    }
    console.log('Result: PASS\n');

    // Test 4: Sort by title ASC
    console.log('--- TEST 4: GET /books?order_by=title&order=ASC (Sort title ASC) ---');
    const res4 = await request('GET', '/books?order_by=title&order=ASC');
    console.log(`Status: ${res4.statusCode}`);
    const titles = res4.body.map(b => b.title);
    const isSortedAsc = titles.slice(1).every((t, i) => titles[i].localeCompare(t) <= 0);
    if (res4.statusCode !== 200 || !isSortedAsc) {
      throw new Error(`Test 4 Failed: Titles not properly sorted ASC`);
    }
    console.log('Result: PASS\n');

    // Test 5: Pagination (limit=3&offset=2)
    console.log('--- TEST 5: GET /books?limit=3&offset=2 (Pagination) ---');
    const res5 = await request('GET', '/books?limit=3&offset=2');
    console.log(`Status: ${res5.statusCode} | Count: ${res5.body.length}`);
    if (res5.statusCode !== 200 || res5.body.length !== 3 || res5.body[0].id !== 3) {
      throw new Error(`Test 5 Failed: Expected 3 books starting from ID 3`);
    }
    console.log('Returned Book IDs:', res5.body.map(b => b.id));
    console.log('Result: PASS\n');

    // Test 6: Price range filter (min_price=250&max_price=400)
    console.log('--- TEST 6: GET /books?min_price=250&max_price=400 (Price range filter) ---');
    const res6 = await request('GET', '/books?min_price=250&max_price=400');
    console.log(`Status: ${res6.statusCode} | Count: ${res6.body.length}`);
    const inRange = res6.body.every(b => b.price >= 250 && b.price <= 400);
    if (res6.statusCode !== 200 || !inRange || res6.body.length === 0) {
      throw new Error(`Test 6 Failed: Books not within 250 - 400 range`);
    }
    console.log('Sample matched prices:', res6.body.map(b => b.price));
    console.log('Result: PASS\n');

    // Test 7: Price filter min_price only (min_price=400)
    console.log('--- TEST 7: GET /books?min_price=400 (Min price only) ---');
    const res7 = await request('GET', '/books?min_price=400');
    console.log(`Status: ${res7.statusCode} | Count: ${res7.body.length}`);
    const minPass = res7.body.every(b => b.price >= 400);
    if (res7.statusCode !== 200 || !minPass) {
      throw new Error(`Test 7 Failed: Some books below 400`);
    }
    console.log('Result: PASS\n');

    // Test 8: Price filter max_price only (max_price=300)
    console.log('--- TEST 8: GET /books?max_price=300 (Max price only) ---');
    const res8 = await request('GET', '/books?max_price=300');
    console.log(`Status: ${res8.statusCode} | Count: ${res8.body.length}`);
    const maxPass = res8.body.every(b => b.price <= 300);
    if (res8.statusCode !== 200 || !maxPass) {
      throw new Error(`Test 8 Failed: Some books above 300`);
    }
    console.log('Result: PASS\n');

    // Test 9: Invalid order_by column (400 Bad Request)
    console.log('--- TEST 9: GET /books?order_by=invalid_col (Invalid column validation) ---');
    const res9 = await request('GET', '/books?order_by=invalid_col');
    console.log(`Status: ${res9.statusCode} | Message: ${res9.body.message}`);
    if (res9.statusCode !== 400) {
      throw new Error(`Test 9 Failed: Expected 400, got ${res9.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 10: Invalid order direction (400 Bad Request)
    console.log('--- TEST 10: GET /books?order=REVERSE (Invalid order direction) ---');
    const res10 = await request('GET', '/books?order=REVERSE');
    console.log(`Status: ${res10.statusCode} | Message: ${res10.body.message}`);
    if (res10.statusCode !== 400) {
      throw new Error(`Test 10 Failed: Expected 400, got ${res10.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 11: Invalid limit (400 Bad Request)
    console.log('--- TEST 11: GET /books?limit=-5 (Invalid limit) ---');
    const res11 = await request('GET', '/books?limit=-5');
    console.log(`Status: ${res11.statusCode} | Message: ${res11.body.message}`);
    if (res11.statusCode !== 400) {
      throw new Error(`Test 11 Failed: Expected 400, got ${res11.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 12: Invalid price range: min > max (400 Bad Request)
    console.log('--- TEST 12: GET /books?min_price=500&max_price=200 (min > max validation) ---');
    const res12 = await request('GET', '/books?min_price=500&max_price=200');
    console.log(`Status: ${res12.statusCode} | Message: ${res12.body.message}`);
    if (res12.statusCode !== 400) {
      throw new Error(`Test 12 Failed: Expected 400, got ${res12.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 13: Invalid price format (400 Bad Request)
    console.log('--- TEST 13: GET /books?min_price=abc (Non-numeric price) ---');
    const res13 = await request('GET', '/books?min_price=abc');
    console.log(`Status: ${res13.statusCode} | Message: ${res13.body.message}`);
    if (res13.statusCode !== 400) {
      throw new Error(`Test 13 Failed: Expected 400, got ${res13.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 14: GET /books/1 (Single book success -> 200)
    console.log('--- TEST 14: GET /books/1 (Retrieve single book) ---');
    const res14 = await request('GET', '/books/1');
    console.log(`Status: ${res14.statusCode} | Book: ${res14.body.title}`);
    if (res14.statusCode !== 200 || res14.body.id !== 1) {
      throw new Error(`Test 14 Failed: Expected 200 with ID 1`);
    }
    console.log('Result: PASS\n');

    // Test 15: GET /books/999 (Nonexistent book -> 404)
    console.log('--- TEST 15: GET /books/999 (Nonexistent book) ---');
    const res15 = await request('GET', '/books/999');
    console.log(`Status: ${res15.statusCode} | Message: ${res15.body.message}`);
    if (res15.statusCode !== 404) {
      throw new Error(`Test 15 Failed: Expected 404, got ${res15.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 16: POST /books (Valid creation -> 201)
    console.log('--- TEST 16: POST /books (Create new book) ---');
    const newBookPayload = {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      price: 650,
      pages: 464
    };
    const res16 = await request('POST', '/books', newBookPayload);
    console.log(`Status: ${res16.statusCode} | Response:`, res16.body);
    if (res16.statusCode !== 201 || !res16.body.book || !res16.body.book.id) {
      throw new Error(`Test 16 Failed: Expected 201 with created book object`);
    }
    createdBookId = res16.body.book.id;
    console.log(`Created Book ID dynamically: ${createdBookId}`);
    console.log('Result: PASS\n');

    // Test 17A: POST /books with missing title -> 400
    console.log('--- TEST 17A: POST /books (Missing title validation) ---');
    const res17A = await request('POST', '/books', {
      author: 'Robert C. Martin',
      price: 650,
      pages: 464
    });
    console.log(`Status: ${res17A.statusCode} | Message: ${res17A.body.message}`);
    if (res17A.statusCode !== 400 || !res17A.body.message.includes('title')) {
      throw new Error(`Test 17A Failed: Expected 400 with title error, got ${res17A.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 17B: POST /books with missing author -> 400
    console.log('--- TEST 17B: POST /books (Missing author validation) ---');
    const res17B = await request('POST', '/books', {
      title: 'Clean Code',
      price: 650,
      pages: 464
    });
    console.log(`Status: ${res17B.statusCode} | Message: ${res17B.body.message}`);
    if (res17B.statusCode !== 400 || !res17B.body.message.includes('author')) {
      throw new Error(`Test 17B Failed: Expected 400 with author error, got ${res17B.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 17C: POST /books with non-numeric price -> 400
    console.log('--- TEST 17C: POST /books (Non-numeric price validation) ---');
    const res17C = await request('POST', '/books', {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      price: 'not-a-number',
      pages: 464
    });
    console.log(`Status: ${res17C.statusCode} | Message: ${res17C.body.message}`);
    if (res17C.statusCode !== 400 || !res17C.body.message.includes('price')) {
      throw new Error(`Test 17C Failed: Expected 400 with price error, got ${res17C.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 18: PUT /books/:bookId (Update book -> 200)
    console.log(`--- TEST 18: PUT /books/${createdBookId} (Update book) ---`);
    const updatePayload = {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      price: 750,
      pages: 464
    };
    const res18 = await request('PUT', `/books/${createdBookId}`, updatePayload);
    console.log(`Status: ${res18.statusCode} | Response:`, res18.body);
    if (res18.statusCode !== 200 || res18.body.book.price !== 750) {
      throw new Error(`Test 18 Failed: Expected 200 with updated price`);
    }
    console.log('Result: PASS\n');

    // Test 19: DELETE /books/:bookId (Delete book -> 200)
    console.log(`--- TEST 19: DELETE /books/${createdBookId} (Delete book) ---`);
    const res19 = await request('DELETE', `/books/${createdBookId}`);
    console.log(`Status: ${res19.statusCode} | Message: ${res19.body.message}`);
    if (res19.statusCode !== 200) {
      throw new Error(`Test 19 Failed: Expected 200, got ${res19.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Verify deletion: GET /books/:bookId should return 404
    console.log(`--- VERIFY DELETION: GET /books/${createdBookId} ---`);
    const resVerify = await request('GET', `/books/${createdBookId}`);
    console.log(`Status: ${resVerify.statusCode} | Message: ${resVerify.body.message}`);
    if (resVerify.statusCode !== 404) {
      throw new Error(`Verify Deletion Failed: Expected 404, got ${resVerify.statusCode}`);
    }
    console.log('Result: PASS (Deletion verified)\n');
    createdBookId = null; // Successfully cleaned up

    // Final database count verification
    console.log('--- FINAL DATABASE RECORD INTEGRITY CHECK ---');
    const finalCheck = await request('GET', '/books');
    console.log(`Database record count after cleanup: ${finalCheck.body.length}`);
    if (finalCheck.body.length !== 10) {
      throw new Error(`Record count mismatch: Expected 10 original books, found ${finalCheck.body.length}`);
    }
    console.log('Initial sample dataset integrity verified: Exactly 10 records preserved.\n');

    console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    testFailed = true;
    console.error('\nTest Execution Error:', err.message);
  } finally {
    if (createdBookId) {
      try {
        console.log(`Cleaning up leftover test record ID ${createdBookId}...`);
        await request('DELETE', `/books/${createdBookId}`);
      } catch (e) { }
    }
    if (server) {
      server.close();
    }
    process.exit(testFailed ? 1 : 0);
  }
}

runTests();
