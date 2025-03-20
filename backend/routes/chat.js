// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const PDF = require('../models/PDF');
const { authMiddleware } = require('./auth');
const { get_conversational_chain, get_pdf_text, get_text_chunks, get_vector_store, generate_chat_title } = require('../utils');

router.post('/new', authMiddleware, async (req, res) => {
  try {
    const chat = new Chat({ userId: req.user.id });
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/message', authMiddleware, async (req, res) => {
  const { chatId, message } = req.body;
  try {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.userId.toString() !== req.user.id) return res.status(403).json({ msg: 'Unauthorized' });

    chat.messages.push({ role: 'user', content: message });

    if (chat.messages.length === 1) {
      const title = await generate_chat_title(message);
      chat.title = title;
    }

    await chat.save();

    const pdfs = await PDF.find({ chatId: chat._id });
    const pdfBuffers = pdfs.map(pdf => pdf.data);
    const rawText = await get_pdf_text(pdfBuffers);
    const textChunks = get_text_chunks(rawText);
    const vectorStore = get_vector_store(textChunks);
    const chain = get_conversational_chain();

    const response = await chain({
      input_documents: vectorStore,
      question: message,
    });

    chat.messages.push({ role: 'assistant', content: response.output_text });
    await chat.save();

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// New endpoint to delete a chat
router.delete('/delete/:chatId', authMiddleware, async (req, res) => {
  const { chatId } = req.params;
  try {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    // Delete associated PDFs
    await PDF.deleteMany({ chatId });

    res.json({ msg: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    chat.messages = []; // Clear the messages array
    await chat.save();
    res.status(200).json({ msg: 'Messages cleared successfully' });
  } catch (err) {
    console.error('Error clearing messages:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;