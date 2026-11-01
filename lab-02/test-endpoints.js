// =============================================================================
// Comprehensive Test Suite for Lab 02 API Endpoints
// =============================================================================

const http = require('http');
const app = require('./server');

const TEST_PORT = 3001;

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
  console.log('=== STARTING LAB 02 COMPREHENSIVE ENDPOINT TESTS ===\n');

  let server;
  let createdBookId = null;
  let testFailed = false;

  try {
    server = await new Promise((resolve) => {
      const s = app.listen(TEST_PORT, () => resolve(s));
    });

    // Allow DB connection to settle
    await new Promise(r => setTimeout(r, 500));

    // Test 1: GET all books
    console.log('--- TEST 1: GET /books/ (Retrieve all books) ---');
    const res1 = await request('GET', '/books/');
    console.log(`Status: ${res1.statusCode}`);
    console.log(`Total books retrieved: ${Array.isArray(res1.body) ? res1.body.length : 0}`);
    console.log(`First book sample:`, res1.body[0]);
    if (res1.statusCode !== 200 || !Array.isArray(res1.body) || res1.body.length !== 10) {
      throw new Error(`Test 1 Failed: Expected status 200 and 10 books, got ${res1.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 2: GET single existing book
    console.log('--- TEST 2: GET /books/1/ (Retrieve book by ID 1) ---');
    const res2 = await request('GET', '/books/1/');
    console.log(`Status: ${res2.statusCode}`);
    console.log(`Book details:`, res2.body);
    if (res2.statusCode !== 200 || res2.body.id !== 1) {
      throw new Error(`Test 2 Failed: Expected book with id 1, got ${JSON.stringify(res2.body)}`);
    }
    console.log('Result: PASS\n');

    // Test 3: GET nonexistent book (404)
    console.log('--- TEST 3: GET /books/999/ (Retrieve nonexistent book) ---');
    const res3 = await request('GET', '/books/999/');
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Response:`, res3.body);
    if (res3.statusCode !== 404) {
      throw new Error(`Test 3 Failed: Expected status 404, got ${res3.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 4: POST a new book
    console.log('--- TEST 4: POST /books/ (Insert a new book) ---');
    const newBookPayload = {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      price: 650,
      pages: 464
    };
    const res4 = await request('POST', '/books/', newBookPayload);
    console.log(`Status: ${res4.statusCode}`);
    console.log(`Response:`, res4.body);
    if (res4.statusCode !== 201 || !res4.body.book || !res4.body.book.id) {
      throw new Error(`Test 4 Failed: Expected 201 and created book, got ${res4.statusCode}`);
    }
    createdBookId = res4.body.book.id;
    console.log(`Created Book ID dynamically: ${createdBookId}`);
    console.log('Result: PASS\n');

    // Test 5: PUT update the newly inserted book
    console.log(`--- TEST 5: PUT /books/${createdBookId}/ (Update the new book) ---`);
    const updatePayload = {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      price: 750,
      pages: 464
    };
    const res5 = await request('PUT', `/books/${createdBookId}/`, updatePayload);
    console.log(`Status: ${res5.statusCode}`);
    console.log(`Response:`, res5.body);
    if (res5.statusCode !== 200 || !res5.body.book || res5.body.book.price !== 750) {
      throw new Error(`Test 5 Failed: Expected 200 and updated price 750, got ${res5.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 6: Verify PUT updated data via GET
    console.log(`--- TEST 6: GET /books/${createdBookId}/ (Verify updated record) ---`);
    const res6 = await request('GET', `/books/${createdBookId}/`);
    console.log(`Status: ${res6.statusCode}`);
    console.log(`Verified Book:`, res6.body);
    if (res6.statusCode !== 200 || res6.body.price !== 750) {
      throw new Error(`Test 6 Failed: Expected verified price 750, got ${res6.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 7: DELETE the newly inserted book
    console.log(`--- TEST 7: DELETE /books/${createdBookId}/ (Delete the book) ---`);
    const res7 = await request('DELETE', `/books/${createdBookId}/`);
    console.log(`Status: ${res7.statusCode}`);
    console.log(`Response:`, res7.body);
    if (res7.statusCode !== 200) {
      throw new Error(`Test 7 Failed: Expected 200 on delete, got ${res7.statusCode}`);
    }
    // Mark as deleted so finally block doesn't need to delete again
    const deletedId = createdBookId;
    createdBookId = null;
    console.log('Result: PASS\n');

    // Test 8: Confirm deleted book no longer exists
    console.log(`--- TEST 8: GET /books/${deletedId}/ (Confirm deletion -> 404) ---`);
    const res8 = await request('GET', `/books/${deletedId}/`);
    console.log(`Status: ${res8.statusCode}`);
    console.log(`Response:`, res8.body);
    if (res8.statusCode !== 404) {
      throw new Error(`Test 8 Failed: Expected 404 for deleted book, got ${res8.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 9: POST with invalid / missing payload (400)
    console.log('--- TEST 9: POST /books/ with missing fields (400) ---');
    const res9 = await request('POST', '/books/', { title: 'Incomplete Book' });
    console.log(`Status: ${res9.statusCode}`);
    console.log(`Response:`, res9.body);
    if (res9.statusCode !== 400) {
      throw new Error(`Test 9 Failed: Expected 400 for missing fields, got ${res9.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Test 10: Unknown route 404 handler
    console.log('--- TEST 10: GET /unknown-endpoint (404 Fallback) ---');
    const res10 = await request('GET', '/unknown-endpoint');
    console.log(`Status: ${res10.statusCode}`);
    console.log(`Response:`, res10.body);
    if (res10.statusCode !== 404) {
      throw new Error(`Test 10 Failed: Expected 404 for unknown route, got ${res10.statusCode}`);
    }
    console.log('Result: PASS\n');

    // Final database count verification
    console.log('--- FINAL DATABASE VERIFICATION ---');
    const finalCheck = await request('GET', '/books/');
    console.log(`Database record count after cleanup: ${finalCheck.body.length}`);
    if (finalCheck.body.length !== 10) {
      throw new Error(`Final Verification Failed: Expected 10 original books, found ${finalCheck.body.length}`);
    }
    console.log('Initial sample dataset integrity verified: Exactly 10 records preserved.\n');

    console.log('=== ALL 10 TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    testFailed = true;
    console.error('\nTest Execution Error:', err.message);
  } finally {
    // Ensure temporary record cleanup if test failed before deleting
    if (createdBookId) {
      console.log(`Cleaning up leftover test record ID ${createdBookId}...`);
      try {
        await request('DELETE', `/books/${createdBookId}/`);
        console.log(`Cleanup completed for ID ${createdBookId}.`);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr.message);
      }
    }
    if (server) {
      server.close();
    }
    process.exit(testFailed ? 1 : 0);
  }
}

runTests();
