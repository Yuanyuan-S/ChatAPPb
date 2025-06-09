import dotenv from 'dotenv';
import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function chatWithAI(prompt) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://localhost',  // Required by OpenRouter
        'X-Title': 'Chat with AI',  // Optional - shows up in OpenRouter dashboard
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat:free',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'An error occurred');
    }

    // Format the response to handle markdown
    const rawContent = data.choices[0].message.content;
    
    // Remove markdown code blocks
    const formattedContent = rawContent
      .replace(/```[\s\S]*?```/g, (match) => {
        // Extract code from between backticks
        const code = match.slice(3, -3).trim();
        return code;
      })
      // Remove single backticks
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown links
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove headers
      .replace(/#+\s/g, '')
      // Remove bold/italic markers
      .replace(/[\*_]{1,2}([^\*_]+)[\*_]{1,2}/g, '$1');

    return formattedContent;
  } catch (error) {
    console.error('Error:', error.message);
    return 'Sorry, an error occurred while processing your request.';
  }
}

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatWithAI(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
