const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');

// Calculate standard System Usability Scale (SUS) score
function calculateSUS(responses) {
  // responses: [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10] where each is 1-5
  let sum = 0;
  // Odd questions (0, 2, 4, 6, 8 in 0-index): score - 1
  // Even questions (1, 3, 5, 7, 9 in 0-index): 5 - score
  for (let i = 0; i < 10; i++) {
    const val = parseInt(responses[i]) || 3;
    if (i % 2 === 0) {
      sum += (val - 1);
    } else {
      sum += (5 - val);
    }
  }
  const susScore = parseFloat((sum * 2.5).toFixed(1));
  
  let grade = 'F (Not Acceptable)';
  let rating = 'Poor';
  if (susScore >= 85) {
    grade = 'A+ (Best Imaginable)';
    rating = 'Excellent';
  } else if (susScore >= 80.3) {
    grade = 'A (Excellent)';
    rating = 'Very Good';
  } else if (susScore >= 68) {
    grade = 'B (Good / Acceptable)';
    rating = 'Good';
  } else if (susScore >= 51) {
    grade = 'C (OK / Marginal)';
    rating = 'Fair';
  }

  return { susScore, grade, rating };
}

// GET all evaluations
router.get('/', (req, res) => {
  try {
    const evaluations = db.prepare('SELECT * FROM usability_evaluations ORDER BY created_at DESC').all();

    // Compute average SUS score if evaluations exist
    let averageScore = 0;
    if (evaluations.length > 0) {
      const sum = evaluations.reduce((acc, e) => acc + e.sus_score, 0);
      averageScore = parseFloat((sum / evaluations.length).toFixed(1));
    }

    res.json({
      evaluations,
      count: evaluations.length,
      average_sus_score: averageScore
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new SUS evaluation
router.post('/', (req, res) => {
  try {
    const {
      evaluator_name,
      evaluator_role,
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
      comments
    } = req.body;

    if (!evaluator_name || !evaluator_role) {
      return res.status(400).json({ error: 'Evaluator name and role are required.' });
    }

    const responses = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10];
    const { susScore, grade, rating } = calculateSUS(responses);

    const stmt = db.prepare(`
      INSERT INTO usability_evaluations (
        evaluator_name, evaluator_role,
        q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
        sus_score, comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      evaluator_name.trim(),
      evaluator_role.trim(),
      parseInt(q1), parseInt(q2), parseInt(q3), parseInt(q4), parseInt(q5),
      parseInt(q6), parseInt(q7), parseInt(q8), parseInt(q9), parseInt(q10),
      susScore,
      comments || ''
    );

    logAudit('SUBMIT_EVALUATION', 'EVALUATION', result.lastInsertRowid, {
      evaluator: evaluator_name,
      role: evaluator_role,
      sus_score: susScore,
      grade,
      rating
    });

    res.status(201).json({
      id: result.lastInsertRowid,
      sus_score: susScore,
      grade,
      rating,
      message: `System Usability Scale evaluation recorded with score: ${susScore} (${rating} - ${grade})`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
