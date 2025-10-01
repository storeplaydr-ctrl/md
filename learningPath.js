const express = require('express');

const User = require('./User');

const router = express.Router();

// Generate learning path
router.post('/generate', async (req, res) => {
  try {
    const { topic, difficulty = 'beginner', duration = 'medium' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Simulate AI-generated learning path
    const modules = generateLearningModules(topic, difficulty, duration);

    const learningPath = {
      title: `${topic} Learning Path`,
      description: `Comprehensive ${difficulty}-level course on ${topic}`,
      modules,
      createdAt: new Date()
    };

    // Save to user's learning paths
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { learningPaths: learningPath } },
      { new: true }
    );

    res.json({
      success: true,
      learningPath
    });
  } catch (err) {
    console.error('Generate learning path error:', err);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

// Get user's learning paths
router.get('/my-paths',  async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('learningPaths');
    res.json({ learningPaths: user.learningPaths || [] });
  } catch (err) {
    console.error('Get learning paths error:', err);
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

// Helper function to generate learning modules
function generateLearningModules(topic, difficulty, duration) {
  const baseModules = [
    `Introduction to ${topic}`,
    `Core Concepts of ${topic}`,
    `Practical Applications`,
    `Advanced Techniques`,
    `Real-world Projects`,
    `Assessment and Review`
  ];

  const difficultyModifiers = {
    beginner: ['Fundamentals', 'Basic Examples', 'Getting Started'],
    intermediate: ['In-depth Analysis', 'Case Studies', 'Best Practices'],
    advanced: ['Expert Techniques', 'Complex Scenarios', 'Research Topics']
  };

  const modules = [...baseModules];

  // Add difficulty-specific modules
  if (difficultyModifiers[difficulty]) {
    modules.splice(2, 0, ...difficultyModifiers[difficulty].slice(0, 2));
  }

  return modules.slice(0, duration === 'short' ? 4 : duration === 'long' ? 8 : 6);
}

module.exports = router;
