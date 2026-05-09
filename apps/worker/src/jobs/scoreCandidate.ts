import { openai } from '../lib/openai.js';
import { fetchAndParsePdf } from '../lib/pdf.js';
import { fetchAndParseDocx } from '../lib/docx.js';
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
      resume_summary: 'Avaliação por IA não disponível.',
      experience_level: 'Não identificado',
    };
  }

  try {
    // Parse resume (PDF and Word .docx/.doc; malformed/failed fetch → we evaluate from answers)
    const resumeFallbackMessage =
      '[O currículo não pôde ser lido automaticamente. Possíveis causas: PDF gerado como imagem (escaneado), PDF malformado ou falha ao buscar o arquivo. Baseie a avaliação principalmente nas respostas da candidatura abaixo.]';
    let resumeText = '';
    let resumeUnparseable = false;
    const resumeUrlLower = candidate.resume_url.toLowerCase();
    const endsWithPdf = resumeUrlLower.endsWith('.pdf');
    const endsWithDocx = resumeUrlLower.endsWith('.docx') || resumeUrlLower.endsWith('.doc');
    if (endsWithPdf) {
      resumeText = await fetchAndParsePdf(candidate.resume_url);
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
      resumeText = 'Formato de currículo não suportado para leitura automática.';
      resumeUnparseable = true;
    }

    // Prepare application answers
    const questions = (candidate.job.application_questions || []) as ApplicationQuestion[];
    const answers = (candidate.application_answers || []) as ApplicationAnswer[];
    
    const answersText = questions
      .map((q) => {
        const answer = answers.find((a) => a.question_id === q.id);
        return `P: ${q.question}\nR: ${answer?.answer || 'Sem resposta'}`;
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
    const prompt = `Você é um recrutador especialista avaliando um candidato. Analise as informações abaixo e forneça uma avaliação detalhada.

IMPORTANTE: Responda SEMPRE em português brasileiro (PT-BR), independentemente do idioma do currículo ou das respostas do candidato.

TÍTULO DA VAGA: ${candidate.job.title}

DESCRIÇÃO DA VAGA:
${candidate.job.description}

NOME DO CANDIDATO: ${candidate.name}

CURRÍCULO:
${resumeText.substring(0, 5000)} ${resumeText.length > 5000 ? '...(truncado)' : ''}

RESPOSTAS DA CANDIDATURA:
${answersText || 'Sem perguntas de candidatura.'}

PESOS DA AVALIAÇÃO:
- Peso do currículo: ${resumePercent}%
- Peso das respostas: ${answersPercent}%
${scoringInstructions ? `\nINSTRUÇÕES ADICIONAIS DO RECRUTADOR:\n${scoringInstructions}` : ''}

Avalie o candidato e forneça:
1. resume_rating: Nota de 1 a 5 pela qualidade e relevância do currículo (se não foi possível ler, use 3 e explique no resume_summary)
2. answer_quality_rating: Nota de 1 a 5 pela qualidade das respostas da candidatura
3. resume_summary: Resumo breve de 2 a 3 frases em PT-BR. Se o currículo não pôde ser lido, escreva: "Currículo não pôde ser lido automaticamente (pode ser PDF gerado como imagem). Avaliação baseada nas respostas da candidatura." e resuma o que é possível inferir das respostas.
4. experience_level: Um dos seguintes valores: "Estágio", "Júnior", "Pleno", "Sênior", "Líder", "Executivo" (se não for possível identificar, use "Não identificado")

IMPORTANTE: Considere os pesos na avaliação. Se o currículo não pôde ser lido, baseie-se nas respostas e não penalize o candidato pelo problema de leitura. Responda SOMENTE em português brasileiro.

Responda apenas em formato JSON:
{
  "resume_rating": <número 1-5>,
  "answer_quality_rating": <número 1-5>,
  "resume_summary": "<string em PT-BR>",
  "experience_level": "<string>"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um recrutador especialista. Responda sempre em português brasileiro (PT-BR) e apenas com JSON válido.',
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
      resume_summary: result.resume_summary || 'Resumo não disponível.',
      experience_level: result.experience_level || 'Não identificado',
    };
  } catch (error) {
    console.error('Error scoring candidate:', error);
    
    // Return default scores on error
    return {
      fit_score: 50,
      resume_rating: 3,
      answer_quality_rating: 3,
      resume_summary: 'Erro durante a avaliação por IA.',
      experience_level: 'Não identificado',
    };
  }
}
