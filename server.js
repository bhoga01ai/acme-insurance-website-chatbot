require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const { appendFile, readFile, writeFile } = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static('.'));
app.use(express.static('public'));
app.use('/js', express.static(path.join(__dirname, 'js'))); // Serve static files from current directory

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Form submission endpoint
app.post('/api/send-inquiry', async (req, res) => {
  try {
    const { name, email, phone, insuranceType, message, optIn, recaptchaToken } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !insuranceType || !message || !recaptchaToken) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    // Temporarily bypass reCAPTCHA verification for testing
    console.log('Bypassing reCAPTCHA verification for testing');
    
    // In production, you would verify reCAPTCHA here
    // try {
    //   const recaptchaResponse = await axios.post(
    //     `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    //   );
    //   
    //   if (!recaptchaResponse.data.success) {
    //     return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
    //   }
    // } catch (error) {
    //   console.error('reCAPTCHA verification error:', error);
    //   return res.status(500).json({ success: false, message: 'reCAPTCHA verification failed' });
    // }
    
    // In a real implementation, you would send an email here
    // For example, using nodemailer or a service like SendGrid
    
    // For demonstration purposes, we'll just log the data
    console.log('Form submission received:', {
      name,
      email,
      phone,
      insuranceType,
      message,
      optIn: optIn ? 'Yes' : 'No'
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Thank you for contacting us. We will get back to you soon.'
    });
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({
      success: false,
      message: 'There was an error processing your request. Please try again.'
    });
  }
});

// Endpoint to save form data to CSV
app.post('/save-to-csv', async (req, res) => {
  try {
    const { filename, data } = req.body;
    
    if (!filename || !data) {
      return res.status(400).json({ success: false, message: 'Filename and data are required' });
    }
    
    const dataDir = path.join(__dirname, 'data');
    const filePath = path.join(dataDir, filename);
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if file exists
    let fileExists = false;
    try {
      await readFile(filePath, 'utf8');
      fileExists = true;
    } catch (error) {
      // File doesn't exist, which is fine for new files
      fileExists = false;
    }
    
    if (fileExists) {
      // If file exists, append data without headers
      const lines = data.split('\n');
      if (lines.length >= 2) {
        // Skip the header line and append only the data line
        await appendFile(filePath, lines[1]);
      }
    } else {
      // If file doesn't exist, write the entire content (headers + data)
      await writeFile(filePath, data);
    }
    
    res.status(200).json({
      success: true,
      message: 'Data saved to CSV successfully'
    });
    
  } catch (error) {
    console.error('Error saving data to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'There was an error saving the data. Please try again.'
    });
  }
});

// Endpoint to save scraped website content to a text file
app.post('/save-content', async (req, res) => {
  try {
    console.log('Received save-content request');
    console.log('Request body:', req.body);
    
    if (!req.body || !req.body.content) {
      console.log('No content provided in request body');
      return res.status(400).json({ success: false, message: 'No content provided' });
    }
    
    const content = req.body.content;
    const dataDir = path.join(__dirname, 'data');
    const filePath = path.join(dataDir, 'website_content.txt');
    
    console.log('Saving content to:', filePath);
    console.log('Content length:', content.length);
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save the content to file
    await writeFile(filePath, content);
    
    res.status(200).json({
      success: true,
      message: 'Website content saved successfully',
      filePath: '/data/website_content.txt'
    });
    
  } catch (error) {
    console.error('Error saving website content:', error);
    res.status(500).json({
      success: false,
      message: 'There was an error saving the website content. Please try again.'
    });
  }
});

// Start server
// Start the server if not being imported by Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app;