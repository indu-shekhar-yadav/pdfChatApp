// backend/routes/pdf.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PDF = require('../models/PDF');

// Upload a PDF
router.post('/upload', auth, async (req, res) => {
  try {
    const { chatId } = req.body;
    const pdfFile = req.files?.pdf;

    if (!pdfFile) {
      return res.status(400).json({ msg: 'No PDF file uploaded' });
    }

    const pdf = new PDF({
      user: req.user.id,
      chat: chatId || null,
      filename: pdfFile.name,
      data: pdfFile.data,
    });
    await pdf.save();

    res.json({ msg: 'PDF uploaded successfully', pdf });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// List uploaded PDFs
router.get('/list', auth, async (req, res) => {
  try {
    const { chatId } = req.query;
    const query = { user: req.user.id };
    if (chatId) {
      query.chat = chatId;
    }

    const pdfs = await PDF.find(query).sort({ uploadedAt: -1 });
    res.json(pdfs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;