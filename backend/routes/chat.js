// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const PDF = require('../models/PDF');
const auth = require('../middleware/auth');
const {
  get_pdf_text,
  get_text_chunks,
  get_vector_store,
  get_conversational_chain,
  generate_chat_title,
} = require('../utils');

// Create a new chat
router.post('/new', auth, async (req, res) => {
  try {
    const chat = new Chat({
      user: req.user.id,
      messages: [],
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    console.error('Error creating chat:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get chat history
router.get('/history', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }
    res.status(200).json(chat.messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Send a message
router.post('/message', auth, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    // Add user message
    chat.messages.push({
      sender: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Fetch associated PDF (if any)
    const pdf = await PDF.findOne({ chat: chatId, user: req.user.id });
    let aiResponse = 'No PDF found for this chat. Please upload a PDF to get AI responses.';

    if (pdf) {
      // Extract text from the PDF
      const pdfText = await get_pdf_text([pdf.data]);
      if (pdfText) {
        // Process the text into chunks
        const textChunks = get_text_chunks(pdfText);
        const vectorStore = get_vector_store(textChunks);

        // Generate AI response using Gemini
        const conversationalChain = get_conversational_chain();
        const result = await conversationalChain({
          input_documents: vectorStore,
          question: message,
        });
        aiResponse = result.output_text;
      } else {
        aiResponse = 'Error extracting text from the PDF.';
      }
    }

    // Add AI response
    chat.messages.push({
      sender: 'ai',
      content: aiResponse,
      timestamp: new Date(),
    });

    // Generate a new chat title based on the user's message
    const newTitle = await generate_chat_title(message);
    chat.title = newTitle; // Add a title field to the chat

    await chat.save();
    res.status(200).json(chat);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Clear messages for a chat
router.delete('/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    chat.messages = [];
    await chat.save();
    res.status(200).json({ msg: 'Messages cleared successfully' });
  } catch (err) {
    console.error('Error clearing messages:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete a chat
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    await chat.deleteOne();
    res.status(200).json({ msg: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;