require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests from your Netlify domain
app.use(cors({
  origin: 'https://pdfchatapp.netlify.app',
  credentials: true
}));

// Increase the limit for JSON payloads to 10MB (adjust as needed)
app.use(express.json({ limit: '10mb' }));
// Optionally, if you use urlencoded data, increase that limit too
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/pdf', require('./routes/pdf'));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ msg: 'Something went wrong on the server. Please try again later.' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));