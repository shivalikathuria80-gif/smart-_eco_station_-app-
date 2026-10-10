const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory database mock
const accounts = {
  'A3 5F 8C 12': { name: 'Admin User', balance: '150 POINTS', points: 150 },
  '99 1B D4 77': { name: 'Lab Technician', balance: '80 POINTS', points: 80 },
  '12345678': { name: 'John Doe', balance: '310 POINTS', points: 310 }
};

// API: Check Balance & Points
app.post('/api/check-balance', (req, res) => {
  const { cardNumber } = req.body;
  if (!cardNumber || typeof cardNumber !== 'string' || !cardNumber.trim()) {
    return res.status(400).json({ success: false, message: 'Card number is required.' });
  }

  const account = accounts[cardNumber.trim()];
  if (!account) {
    return res.status(404).json({ success: false, message: 'Card number not found in database.' });
  }

  return res.json({
    success: true,
    name: account.name,
    balance: account.balance,
    points: account.points || 0
  });
});

// API: Add Points
app.post('/api/add-points', (req, res) => {
  const { cardNumber, pointsToAdd } = req.body;
  if (!cardNumber || pointsToAdd === undefined || isNaN(pointsToAdd)) {
    return res.status(400).json({ success: false, message: 'Valid card number and points amount required.' });
  }

  const account = accounts[cardNumber.trim()];
  if (!account) {
    return res.status(404).json({ success: false, message: 'Card number not found.' });
  }

  account.points = (account.points || 0) + Number(pointsToAdd);
  return res.json({
    success: true,
    message: `Successfully added ${pointsToAdd} points!`,
    name: account.name,
    totalPoints: account.points
  });
});

// API: Register New Card
app.post('/api/add-card', (req, res) => {
  const { cardNumber, name, balance, points } = req.body;
  if (!cardNumber || !name) {
    return res.status(400).json({ success: false, message: 'Card number and name are required.' });
  }

  const trimmedUID = cardNumber.trim();
  if (accounts[trimmedUID]) {
    return res.status(400).json({ success: false, message: 'Card number already exists!' });
  }

  accounts[trimmedUID] = {
    name: name.trim(),
    balance: balance ? `$${Number(balance).toFixed(2)}` : '$0.00',
    points: points ? Number(points) : 0
  };

  return res.json({
    success: true,
    message: `Card ${trimmedUID} registered successfully for ${name}!`
  });
});

// Serve Index HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Real-time RFID Simulation Engine
io.on('connection', (socket) => {
  console.log('⚡ Client connected to socket');

  const interval = setInterval(() => {
    const uids = Object.keys(accounts);
    const randomUid = uids[Math.floor(Math.random() * uids.length)];
    const isKnown = Math.random() > 0.2;

    const scan = {
      uid: isKnown ? randomUid : '99 99 99 99',
      user: isKnown ? accounts[randomUid].name : 'Unknown User',
      access: isKnown ? 'Granted' : 'Denied',
      time: new Date().toLocaleTimeString()
    };

    io.emit('rfid-scan', scan);
  }, 4000);

  socket.on('disconnect', () => clearInterval(interval));
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`🚀 Server active at http://localhost:${PORT}`);
});