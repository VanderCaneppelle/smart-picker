import { openai } from '../lib/openai.js';
import { fetchAndParsePdf } from '../lib/pdf.js';
import { fetchAndParseDocx } from '../lib/docx.js';
import { debugLog } from '../lib/debugLog.js';
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
    resume_weight: number;
    answers_weight: number;
    scoring_instructions: string | null;
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
    // Parse resume (PDF and Word .docx/.doc; malformed/failed fetch → we evaluate from answers)
    const resumeFallbackMessage =
      '[The resume could not be read automatically. Possible causes: PDF is image-only (scanned/exported as image), malformed PDF, or the file could not be fetched. Please base your evaluation mainly on the application answers below.]';
    let resumeText = '';
    let resumeUnparseable = false;
    // #region agent log
    const resumeUrlLower = candidate.resume_url.toLowerCase();
    const endsWithPdf = resumeUrlLower.endsWith('.pdf');
    const endsWithDocx = resumeUrlLower.endsWith('.docx') || resumeUrlLower.endsWith('.doc');
    const payload1 = { location: 'scoreCandidate.ts:resume-branch', message: 'Resume URL and format check', data: { resume_url: candidate.resume_url, endsWithPdf, endsWithDocx, extension: resumeUrlLower.slice(-8) }, hypothesisId: 'H1-H2' };
    debugLog(payload1);
    fetch('http://127.0.0.1:7243/ingest/4b01b58f-b193-4b12-b52e-e57203e7d60a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload1)}).catch(()=>{});
    // #endregion
    if (endsWithPdf) {
      resumeText = await fetchAndParsePdf(candidate.resume_url);
      // #region agent log
      const payload2 = { location: 'scoreCandidate.ts:after-fetch', message: 'After fetchAndParsePdf', data: { resumeTextLength: resumeText?.length ?? 0, resumeUnparseable: !resumeText || resumeText.length < 50 }, hypothesisId: 'H3-H4' };
      debugLog(payload2);
      fetch('http://127.0.0.1:7243/ingest/4b01b58f-b193-4b12-b52e-e57203e7d60a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload2)}).catch(()=>{});
      // #endregion
      if (!resumeText || resumeText.length < 50) {
        resumeText = resumeFallbackMessage;
        resumeUnparseable = true;
      }
    } else if (endsWithDocx) {
      resumeText = await fetchAndParseDocx(candidate.resume_url);
      if (!resumeText || resumeText.length < 50) {
        resumeText = resumeFallbackMessage;
        resumeUnparseable = true;
      }
    } else {
      resumeText = 'Resume format not supported for parsing.';
      resumeUnparseable = true;
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

    // Get weights from job settings (default to 5 if not set)
    const resumeWeight = candidate.job.resume_weight ?? 5;
    const answersWeight = candidate.job.answers_weight ?? 5;
    const scoringInstructions = candidate.job.scoring_instructions;
    
    const totalWeight = resumeWeight + answersWeight;
    const resumePercent = Math.round((resumeWeight / totalWeight) * 100);
    const answersPercent = Math.round((answersWeight / totalWeight) * 100);

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

EVALUATION WEIGHTS:
- Resume evaluation weight: ${resumePercent}%
- Application answers weight: ${answersPercent}%
${scoringInstructions ? `\nADDITIONAL INSTRUCTIONS FROM RECRUITER:\n${scoringInstructions}` : ''}

Please evaluate this candidate and provide:
1. resume_rating: A score from 1-5 rating the quality and relevance of the resume (if the resume could not be read, use 3 and explain in resume_summary)
2. answer_quality_rating: A score from 1-5 rating the quality of their application answers
3. resume_summary: A brief 2-3 sentence summary. If the resume text was not available or could not be parsed, write something like: "Currículo não pôde ser lido automaticamente (pode ser PDF só com imagem). Avaliação baseada nas respostas da candidatura." Then briefly summarize what you can infer from the application answers.
4. experience_level: One of: "Entry Level", "Junior", "Mid-Level", "Senior", "Lead", "Executive" (if unknown, infer from answers or use "Unknown")

IMPORTANT: Consider the evaluation weights when assessing the candidate. If the resume could not be read, base your evaluation primarily on the application answers and do not penalize the candidate for the parsing issue.

Respond in JSON format only:
{
  "resume_rating": <number 1-5>,
  "answer_quality_rating": <number 1-5>,
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

    // Validate and clamp individual ratings
    const resumeRating = Math.min(5, Math.max(1, Math.round(result.resume_rating || 3)));
    const answerRating = Math.min(5, Math.max(1, Math.round(result.answer_quality_rating || 3)));
    
    // Calculate weighted fit_score based on job settings
    // Convert 1-5 ratings to 0-100 scale and apply weights
    const resumeScore = (resumeRating / 5) * 100;
    const answerScore = (answerRating / 5) * 100;
    const weightedFitScore = Math.round(
      (resumeScore * resumeWeight + answerScore * answersWeight) / totalWeight
    );

    return {
      fit_score: Math.min(100, Math.max(0, weightedFitScore)),
      resume_rating: resumeRating,
      answer_quality_rating: answerRating,
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
