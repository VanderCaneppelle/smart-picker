import { openai } from '../lib/openai.js';
import { fetchAndParsePdf } from '../lib/pdf.js';
import type { ApplicationQuestion, ApplicationAnswer } from '@hunter/core';

interface CandidateWithJob {
  id: string;
  name: string;
  email: string;
  resume_url: string;
  application_answers: unknown;
  job: {
    id: string;
    title: string;
    description: string;
    application_questions: unknown;
  };
}

interface ScoringResult {
  fit_score: number;
  resume_rating: number;
  answer_quality_rating: number;
  resume_summary: string;
  experience_level: string;
}

export async function scoreCandidate(candidate: CandidateWithJob): Promise<ScoringResult> {
  // If OpenAI is not configured, return default scores
  if (!openai) {
    console.log('OpenAI not configured. Returning default scores.');
    return {
      fit_score: 50,
      resume_rating: 3,
      answer_quality_rating: 3,
      resume_summary: 'AI scoring not available.',
      experience_level: 'Unknown',
    };
  }

  try {
    // Parse resume
    let resumeText = '';
    try {
      if (candidate.resume_url.toLowerCase().endsWith('.pdf')) {
        resumeText = await fetchAndParsePdf(candidate.resume_url);
      } else {
        // For non-PDF files, we'll just note that we couldn't parse it
        resumeText = 'Resume format not supported for parsing.';
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      resumeText = 'Failed to parse resume.';
    }

    // Prepare application answers
    const questions = (candidate.job.application_questions || []) as ApplicationQuestion[];
    const answers = (candidate.application_answers || []) as ApplicationAnswer[];
    
    const answersText = questions
      .map((q) => {
        const answer = answers.find((a) => a.question_id === q.id);
        return `Q: ${q.question}\nA: ${answer?.answer || 'No answer provided'}`;
      })
      .join('\n\n');

    // Create the prompt
    const prompt = `You are an expert recruiter evaluating a job candidate. Analyze the following information and provide a detailed evaluation.

JOB TITLE: ${candidate.job.title}

JOB DESCRIPTION:
${candidate.job.description}

CANDIDATE NAME: ${candidate.name}

RESUME:
${resumeText.substring(0, 5000)} ${resumeText.length > 5000 ? '...(truncated)' : ''}

APPLICATION ANSWERS:
${answersText || 'No application questions.'}

Please evaluate this candidate and provide:
1. fit_score: A score from 0-100 indicating how well the candidate fits the job requirements
2. resume_rating: A score from 1-5 rating the quality and relevance of the resume
3. answer_quality_rating: A score from 1-5 rating the quality of their application answers
4. resume_summary: A brief 2-3 sentence summary of the candidate's background and key qualifications
5. experience_level: One of: "Entry Level", "Junior", "Mid-Level", "Senior", "Lead", "Executive"

Respond in JSON format only:
{
  "fit_score": <number>,
  "resume_rating": <number>,
  "answer_quality_rating": <number>,
  "resume_summary": "<string>",
  "experience_level": "<string>"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const result = JSON.parse(content);

    // Validate and clamp values
    return {
      fit_score: Math.min(100, Math.max(0, Math.round(result.fit_score || 50))),
      resume_rating: Math.min(5, Math.max(1, Math.round(result.resume_rating || 3))),
      answer_quality_rating: Math.min(5, Math.max(1, Math.round(result.answer_quality_rating || 3))),
      resume_summary: result.resume_summary || 'No summary available.',
      experience_level: result.experience_level || 'Unknown',
    };
  } catch (error) {
    console.error('Error scoring candidate:', error);
    
    // Return default scores on error
    return {
      fit_score: 50,
      resume_rating: 3,
      answer_quality_rating: 3,
      resume_summary: 'Error during AI evaluation.',
      experience_level: 'Unknown',
    };
  }
}
