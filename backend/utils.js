// backend/utils.js
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Extract text from PDFs
const get_pdf_text = async (pdfBuffers) => {
  try {
    const texts = await Promise.all(pdfBuffers.map(async (buffer) => {
      const data = await pdfParse(buffer);
      return data.text;
    }));
    return texts.join('\n');
  } catch (err) {
    console.error('Error extracting PDF text:', err);
    return '';
  }
};

// Split text into chunks
const get_text_chunks = (text) => {
  const chunkSize = 10000;
  const chunkOverlap = 1000;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
};

// Placeholder for vector store
const get_vector_store = (text_chunks) => {
  return text_chunks;
};

// Conversational chain using Gemini AI
const get_conversational_chain = () => {
  return async ({ input_documents, question }) => {
    try {
      const context = input_documents.join('\n');
      const prompt = `You are a professional AI assistant. Your task is to extract key information from a given context derived from PDF documents and provide a summary in bullet points. Ensure the summary is clear, concise, and devoid of any formatting symbols such as asterisks or hashtags. Maintain a professional tone while infusing a light, engaging style to make the interaction enjoyable.
                      Context: ${context}  
                      Question: ${question}  
                      Instructions:  
                      - Focus on the main ideas and essential details from the context.  
                      - Use simple and direct language.  
                      - Organize the information logically and coherently in bullet points.  
                      - Avoid jargon unless necessary, and explain any technical terms briefly.  
                      - Ensure the summary caters to the user's query effectively and provides value.`;

      const result = await model.generateContent(prompt);
      let response = result.response.text();

      // Clean up any remaining Markdown symbols (just in case)
      response = response.replace(/\*\*/g, '').replace(/\*/g, '-');

      return { output_text: response };
    } catch (err) {
      console.error('Error with Gemini AI:', err.message);
      return { output_text: 'Error processing the request with Gemini AI.' };
    }
  };
};

// Generate a smart chat title using Gemini AI
const generate_chat_title = async (question) => {
  try {
    const prompt = `Generate a concise and descriptive chat title (max 20 characters) based on the following question: "${question}"`;
    const result = await model.generateContent(prompt);
    let title = result.response.text().trim();
    if (title.length > 30) title = title.substring(0, 27) + '...';
    return title;
  } catch (err) {
    console.error('Error generating chat title:', err.message);
    return question.length > 30 ? question.substring(0, 27) + '...' : question;
  }
};

module.exports = {
  get_pdf_text,
  get_text_chunks,
  get_vector_store,
  get_conversational_chain,
  generate_chat_title,
};