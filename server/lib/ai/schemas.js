const { z } = require('zod');

const aiAnalysisSchema = z.object({
    primary_category: z.string(),
    secondary_categories: z.array(z.string()),
    summary: z.string(),
    problem_type: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    required_skills: z.array(z.string()),
    keywords: z.array(z.string()),
    confidence: z.number().min(0).max(1)
});

module.exports = { aiAnalysisSchema };
