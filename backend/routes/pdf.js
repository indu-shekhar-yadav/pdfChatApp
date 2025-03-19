// backend/routes/pdf.js
const express = require('express');
const router = express.Router();
const PDF = require('../models/PDF');
const { authMiddleware } = require('./auth');

router.post('/upload', authMiddleware, async (req, res) => {
  const { filename, data, chatId } = req.body;
  try {
    const pdf = new PDF({
      userId: req.user.id,
      chatId, // Associate with the specific chat
      filename,
      data: Buffer.from(data, 'base64'),
    });
    await pdf.save();
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/list', authMiddleware, async (req, res) => {
  const { chatId } = req.query; // Get PDFs for a specific chat
  try {
    const pdfs = await PDF.find({ userId: req.user.id, chatId });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;