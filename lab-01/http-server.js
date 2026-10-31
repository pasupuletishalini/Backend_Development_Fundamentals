// =============================================================================
// Lab 01: Node.js and Express Server
// Part 1: Plain Node.js HTTP Server
// File: http-server.js
// =============================================================================

// Import the built-in 'http' module provided by Node.js (no npm install needed)
const http = require('http');

// Define the port number on which the server will listen for requests
const PORT = 3000;

// Create an HTTP server instance using the built-in http.createServer() method
// The callback function is invoked every time an incoming HTTP request reaches the server.
// 'req' represents the incoming HTTP request, and 'res' represents the outgoing HTTP response.
const server = http.createServer((req, res) => {
  // Set the HTTP response status code to 200 (OK)
  // and set the 'Content-Type' header to 'text/plain'
  res.writeHead(200, { 'Content-Type': 'text/plain' });

  // Send the response body "Hello" and end the request-response cycle
  res.end('Hello');
});

// Start the server to listen for incoming connections on port 3000
server.listen(PORT, () => {
  console.log(`Plain Node.js HTTP Server is running at http://localhost:${PORT}`);
});

