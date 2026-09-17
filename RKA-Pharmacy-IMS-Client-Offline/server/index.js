const express = require('express');
const cors = require('cors');
const path = require('path');
const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auto-seed if empty
seedDatabase();

// API Routes
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/fefo-plus', require('./routes/fefoPlus'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/simulation', require('./routes/simulation'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/settings', require('./routes/settings'));

// Serve frontend static build in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'R.K.A Pharmacy Inventory Management System',
    location: 'San Antonio, Agoo, La Union',
    client: 'Lourdes Gincen L. Cesista',
    timestamp: new Date().toISOString()
  });
});

// Fallback for Single Page Application
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  }
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` R.K.A PHARMACY INVENTORY MANAGEMENT SYSTEM (FEFO+) `);
  console.log(` San Antonio, Agoo, La Union                           `);
  console.log(` Server active on http://localhost:${PORT}             `);
  console.log(` Client dev proxy: http://localhost:3000              `);
  console.log(`=======================================================`);
});
