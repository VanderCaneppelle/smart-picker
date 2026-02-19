import type {
  ApplicationQuestion,
  ApplicationAnswer,
  DisqualificationFlag,
  DisqualificationSeverity,
} from '@hunter/core';

/**
 * Evaluates eliminatory questions against candidate answers.
 * Returns an array of flags with severity 'eliminated' or 'warning'.
 */
export function evaluateEliminatoryQuestions(
  questions: ApplicationQuestion[],
  answers: ApplicationAnswer[]
): DisqualificationFlag[] {
  const flags: DisqualificationFlag[] = [];

  for (const question of questions) {
    if (!question.is_eliminatory || !question.eliminatory_criteria) continue;

    const answer = answers.find((a) => a.question_id === question.id);
    const answerValue = answer?.answer?.trim() || '';

    if (!answerValue) continue;

    const criteria = question.eliminatory_criteria;

    if (question.type === 'yes_no' && criteria.expected_answer) {
      if (answerValue !== criteria.expected_answer) {
        flags.push({
          question_id: question.id,
          question_text: question.question,
          candidate_answer: answerValue,
          severity: 'eliminated',
          reason: `Resposta "${answerValue}" — esperado "${criteria.expected_answer}"`,
        });
      }
    }

    if (
      (question.type === 'select' || question.type === 'multiselect') &&
      criteria.accepted_values &&
      criteria.accepted_values.length > 0
    ) {
      const candidateValues =
        question.type === 'multiselect' ? answerValue.split('|||') : [answerValue];

      const unaccepted = candidateValues.filter(
        (v) => !criteria.accepted_values!.includes(v)
      );

      if (unaccepted.length > 0) {
        flags.push({
          question_id: question.id,
          question_text: question.question,
          candidate_answer: answerValue.replace(/\|\|\|/g, ', '),
          severity: 'eliminated',
          reason: `Resposta fora das opções aceitas: ${unaccepted.join(', ')}`,
        });
      }
    }

    if (question.type === 'text' || question.type === 'textarea') {
      const numericValue = parseNumericAnswer(answerValue);

      if (numericValue === null) continue;

      const { range_min, range_max, tolerance_percent = 15 } = criteria;

      if (range_min == null && range_max == null) continue;

      const toleranceFraction = tolerance_percent / 100;

      if (range_max != null && numericValue > range_max) {
        const hardLimit = range_max * (1 + toleranceFraction);

        let severity: DisqualificationSeverity;
        let reason: string;

        if (numericValue <= hardLimit) {
          severity = 'warning';
          reason = `Valor ${formatNumber(numericValue)} acima do máximo ${formatNumber(range_max)}, mas dentro da tolerância de ${tolerance_percent}% — negociável`;
        } else {
          severity = 'eliminated';
          reason = `Valor ${formatNumber(numericValue)} muito acima do máximo ${formatNumber(range_max)} (tolerância ${tolerance_percent}% excedida)`;
        }

        flags.push({
          question_id: question.id,
          question_text: question.question,
          candidate_answer: answerValue,
          severity,
          reason,
        });
      } else if (range_min != null && numericValue < range_min) {
        const hardLimit = range_min * (1 - toleranceFraction);

        let severity: DisqualificationSeverity;
        let reason: string;

        if (numericValue >= hardLimit) {
          severity = 'warning';
          reason = `Valor ${formatNumber(numericValue)} abaixo do mínimo ${formatNumber(range_min)}, mas dentro da tolerância de ${tolerance_percent}% — negociável`;
        } else {
          severity = 'eliminated';
          reason = `Valor ${formatNumber(numericValue)} muito abaixo do mínimo ${formatNumber(range_min)} (tolerância ${tolerance_percent}% excedida)`;
        }

        flags.push({
          question_id: question.id,
          question_text: question.question,
          candidate_answer: answerValue,
          severity,
          reason,
        });
      }
    }
  }

  return flags;
}

function parseNumericAnswer(value: string): number | null {
  const cleaned = value.replace(/[R$€£\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}
