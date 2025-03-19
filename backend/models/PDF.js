// backend/models/PDF.js
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }, // Link to specific chat
  filename: { type: String, required: true },
  data: { type: Buffer, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PDF', pdfSchema);