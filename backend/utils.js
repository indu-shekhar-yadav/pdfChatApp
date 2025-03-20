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
      const prompt = `You are a friendly and professional AI assistant with a knack for making conversations engaging and fun. Your task is to answer the user's question based on the given context from PDF documents. Respond in a conversational tone, focusing on the user's query, and present the information in a structured format with section headers and bullet points for clarity. Keep the tone professional yet light-hearted, adding a touch of personality to make the interaction enjoyable. Avoid using formatting symbols like asterisks or hashtags.

                      Context: ${context}  
                      Question: ${question}  
                      Instructions:  
                      - Directly address the user's question with a relevant and concise answer.  
                      - Structure the response with section headers in the format "Section: [Section Name]" (e.g., "Section: Education", "Section: Experience") followed by bullet points for that section.  
                      - Use bullet points (starting with "-") to list key details under each section.  
                      - Maintain a professional tone but add a friendly, engaging vibe (e.g., "Hey there!", "Pretty cool, right?").  
                      - If the question is specific, focus on that topic (e.g., if asked about certificates, highlight only the certificates).  
                      - If the question is broad, provide a brief summary with relevant sections (e.g., Education, Experience, Skills).  
                      - End with a friendly closing statement (e.g., "Let me know if you’d like more details!").  
                      - If the answer isn't clear from the context, let the user know in a friendly way and suggest next steps.`;

      const result = await model.generateContent(prompt);
      let response = result.response.text();

      // Clean up any remaining Markdown symbols (just in case)
      response = response.replace(/\*\*/g, '').replace(/\*/g, '-');

      return { output_text: response };
    } catch (err) {
      console.error('Error with Gemini AI:', err.message);
      return { output_text: 'Oops, something went wrong while processing your request. Let’s try again!' };
    }
  };
};

// Generate a smart chat title using Gemini AI
const generate_chat_title = async (question) => {
  try {
    const prompt = `Generate a concise and descriptive chat title (max 20 characters) based on the following question: "${question}"`;
    const result = await model.generateContent(prompt);
    let title = result.response.text().trim();
    if (title.length > 20) title = title.substring(0, 17) + '...';
    return title;
  } catch (err) {
    console.error('Error generating chat title:', err.message);
    return question.length > 20 ? question.substring(0, 17) + '...' : question;
  }
};

module.exports = {
  get_pdf_text,
  get_text_chunks,
  get_vector_store,
  get_conversational_chain,
  generate_chat_title,
};