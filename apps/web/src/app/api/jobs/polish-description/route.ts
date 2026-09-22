import { NextRequest } from 'next/server';
import { getLocale } from 'next-intl/server';
import { requireAccount } from '@/lib/auth';
import { tradutorDeErros } from '@/lib/erros';

const MAX_INPUT_CHARS = 12000;
const MODEL = process.env.OPENAI_POLISH_MODEL || 'gpt-4o-mini';

/** Tags que o StarterKit do TipTap entende. Qualquer outra vira texto cru no editor. */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr',
]);

/**
 * Deixa passar só as tags do StarterKit e remove todos os atributos.
 * O modelo às vezes devolve <div>, <span style>, classe do Tailwind ou markdown em
 * cerca; nada disso sobrevive ao setContent sem sujar o documento.
 */
function sanitizeHtml(raw: string): string {
  let html = raw.trim();

  // Remove cerca de markdown (```html ... ```)
  html = html.replace(/^```[a-z]*\s*/i, '').replace(/```$/, '').trim();

  // Remove scripts e styles com conteúdo
  html = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Reescreve cada tag: mantém as permitidas sem atributo nenhum, descarta o resto
  html = html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (match, tagName: string) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    return match.startsWith('</') ? `</${tag}>` : `<${tag}>`;
  });

  return html.trim();
}

/** Texto visível, para decidir se sobrou conteúdo de verdade. */
function textLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length;
}

function buildPrompt(jobTitle: string | null, locale: string): string {
  const emIngles = locale === 'en';
  const instrucaoIdioma = emIngles
    ? 'IMPORTANT: write "html" and every item in "missing" in English, whatever language the original text is written in.'
    : 'IMPORTANTE: escreva "html" e cada item de "missing" em português brasileiro, independentemente do idioma do texto original.';

  return `Você reescreve descrições de vaga para um sistema de recrutamento brasileiro.

${instrucaoIdioma}

${jobTitle ? `A vaga se chama "${jobTitle}".` : 'O título da vaga não foi informado.'}

## O QUE FAZER
- Corrija ortografia, acentuação, pontuação e concordância.
- Organize o conteúdo em seções com <h3> quando houver material para isso. Seções úteis:
  Sobre a vaga, Responsabilidades, Requisitos, Diferenciais, Benefícios.
- Transforme enumerações em <ul><li>. Uma ideia por item.
- Quebre parágrafos longos. Mantenha frases curtas.
- Mantenha o tom de quem escreveu. Não deixe o texto genérico nem publicitário.

## O QUE NUNCA FAZER (regra mais importante)
- Nunca invente informação que não está no texto original. Isso inclui salário, benefícios,
  carga horária, modelo de trabalho (remoto, híbrido, presencial), localidade, tempo de
  experiência, formação exigida, tecnologias e nome de empresa.
- Se uma informação importante estiver faltando, NÃO escreva no texto. Liste em "missing".
- Não use emoji.
- Não use travessão (—) nem meia-risca (–). Use vírgula, dois-pontos, parênteses ou frase nova.
- Não escreva markdown. A saída é HTML.

## FORMATO DA SAÍDA
Responda apenas com JSON válido, sem cerca de código:
{
  "html": "<a descrição reescrita, usando somente as tags p, h3, ul, ol, li, strong, em, blockquote>",
  "missing": ["informação importante que o autor não escreveu", "..."]
}
"missing" tem no máximo 4 itens, cada um curto e específico. Se não faltar nada, use [].`;
}

export async function POST(request: NextRequest) {
  const t = await tradutorDeErros();
  const auth = await requireAccount(request);
  if (auth.response) return auth.response;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: 'Service Unavailable',
        message: t('erros.iaSemChave'),
      },
      { status: 503 }
    );
  }

  let body: { html?: unknown; jobTitle?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Bad Request', message: 'JSON inválido' }, { status: 400 });
  }

  const inputHtml = typeof body.html === 'string' ? body.html : '';
  const jobTitle = typeof body.jobTitle === 'string' && body.jobTitle.trim()
    ? body.jobTitle.trim().slice(0, 200)
    : null;

  if (textLength(inputHtml) < 30) {
    return Response.json(
      {
        error: 'Bad Request',
        message: t('erros.descricaoCurta'),
      },
      { status: 400 }
    );
  }

  if (inputHtml.length > MAX_INPUT_CHARS) {
    return Response.json(
      {
        error: 'Payload Too Large',
        message: t('erros.descricaoLonga'),
      },
      { status: 413 }
    );
  }

  try {
    const locale = await getLocale();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildPrompt(jobTitle, locale) },
          { role: 'user', content: inputHtml },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[polish-description] OpenAI error:', response.status, detail.slice(0, 500));
      return Response.json(
        { error: 'Bad Gateway', message: t('erros.iaFalhou') },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    let parsed: { html?: unknown; missing?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('[polish-description] resposta não era JSON:', content.slice(0, 300));
      return Response.json(
        { error: 'Bad Gateway', message: 'Resposta inesperada da IA. Tente de novo.' },
        { status: 502 }
      );
    }

    const html = sanitizeHtml(typeof parsed.html === 'string' ? parsed.html : '');

    if (textLength(html) < 30) {
      return Response.json(
        { error: 'Bad Gateway', message: 'A IA devolveu um texto vazio. Tente de novo.' },
        { status: 502 }
      );
    }

    const missing = Array.isArray(parsed.missing)
      ? parsed.missing
          .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
          .slice(0, 4)
          .map((m) => m.trim().slice(0, 140))
      : [];

    return Response.json({ html, missing });
  } catch (error) {
    console.error('[polish-description] erro inesperado:', error);
    return Response.json(
      { error: 'Internal Server Error', message: t('erros.iaErro') },
      { status: 500 }
    );
  }
}
