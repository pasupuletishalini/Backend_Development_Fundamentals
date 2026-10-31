// =============================================================================
// Lab 01: Node.js and Express Server
// Part 2: Express Server
// File: server.js
// =============================================================================

// Import the Express framework using CommonJS require() syntax
const express = require('express');

// Initialize the Express application
const app = express();

// Define the port number on which the Express server will listen
const PORT = 3000;

// -----------------------------------------------------------------------------
// Route 1: GET /
// Description: Return a friendly welcome message to the user
// Status Code: 200 OK
// -----------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.status(200).send('Welcome to the Backend Development Fundamentals Express Server!');
});

// -----------------------------------------------------------------------------
// Route 2: GET /about
// Description: Return student details as a JSON object
// Status Code: 200 OK
// NOTE: Please replace the placeholder values below with your personal details.
// -----------------------------------------------------------------------------
app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'Pasupuleti Shalini',
    section: 'CSE-2D (214)'
  });
});

// -----------------------------------------------------------------------------
// Route 3: GET /time
// Description: Return the current date and time using JavaScript's new Date()
// Status Code: 200 OK
// -----------------------------------------------------------------------------
app.get('/time', (req, res) => {
  res.status(200).send(new Date().toString());
});

// -----------------------------------------------------------------------------
// Route 4 / Fallback: 404 Handling Middleware
// Description: Matches all unknown/undefined routes, sets status code to 404,
//              and returns a meaningful error message.
// Status Code: 404 Not Found
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).send('404 Not Found: The requested endpoint does not exist.');
});

// -----------------------------------------------------------------------------
// Start the Express Server
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Express Server is running at http://localhost:${PORT}`);
});

