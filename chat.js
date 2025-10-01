const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// AI Mentor Chat
router.post('/mentor', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simulate AI mentor response
    const mentorResponse = generateMentorResponse(message);

    res.json({
      success: true,
      response: mentorResponse,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('AI mentor error:', err);
    res.status(500).json({ error: 'Failed to get mentor response' });
  }
});

// Community chat health check
router.get('/community/health', (req, res) => {
  res.json({ ok: true, route: 'chat/community/health' });
});

// Helper function to generate mentor responses
function generateMentorResponse(userMessage) {
  const responses = [
    "That's a great question! Let me help you understand this concept better.",
    "I can see you're curious about this topic. Here's what I recommend...",
    "Based on your question, I think you'd benefit from focusing on the fundamentals first.",
    "Excellent point! This is a common challenge that many learners face.",
    "Let me break this down for you in simpler terms...",
    "That's an advanced topic! You're making great progress in your learning journey."
  ];

  const keywords = {
    'help': "I'm here to help! What specific area would you like me to explain?",
    'difficult': "I understand this can be challenging. Let's approach it step by step.",
    'confused': "No worries! Confusion is part of learning. Let me clarify this for you.",
    'example': "Great question! Here's a practical example that might help illustrate the concept.",
    'practice': "Practice is key to mastering any skill. I recommend starting with basic exercises."
  };

  // Check for keywords in user message
  const lowerMessage = userMessage.toLowerCase();
  for (const [keyword, response] of Object.entries(keywords)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // Return a random general response
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = router;
