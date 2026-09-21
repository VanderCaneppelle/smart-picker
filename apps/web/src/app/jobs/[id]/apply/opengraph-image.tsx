import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db';

/**
 * Imagem de compartilhamento específica da vaga.
 *
 * O link de candidatura é o que mais circula: o recrutador cola no WhatsApp, no
 * LinkedIn e nos grupos. Com a imagem genérica do produto, todas as vagas apareciam
 * iguais, e quem vê no grupo não sabe do que se trata sem abrir. Aqui o cartão mostra
 * o cargo, o local e a empresa, que é a informação que decide o clique.
 */
export const alt = 'Vaga aberta';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TIPO_LABEL: Record<string, string> = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  contract: 'Contrato',
  internship: 'Estágio',
  freelance: 'Freelance',
};

export default async function Image({ params }: { params: { id: string } }) {
  const vaga = /^[0-9a-f-]{36}$/i.test(params.id)
    ? await prisma.job.findFirst({
        where: { id: params.id, deleted_at: null },
        select: {
          title: true,
          location: true,
          employment_type: true,
          recruiter: { select: { company: true, public_display_name: true } },
        },
      })
    : null;

  const titulo = vaga?.title ?? 'Vaga aberta';
  const empresa = vaga?.recruiter?.public_display_name || vaga?.recruiter?.company || '';
  const detalhes = [vaga?.location, vaga ? TIPO_LABEL[vaga.employment_type] : null]
    .filter(Boolean)
    .join('  ·  ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 30, opacity: 0.85, letterSpacing: 1 }}>
            {empresa ? `${empresa.toUpperCase()} ESTÁ CONTRATANDO` : 'VAGA ABERTA'}
          </div>
          {/* Título longo de vaga é comum; cortar evita que ele estoure o cartão. */}
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.12, marginTop: 24 }}>
            {titulo.length > 80 ? `${titulo.slice(0, 79)}…` : titulo}
          </div>
          {detalhes && (
            <div style={{ fontSize: 32, marginTop: 24, opacity: 0.9 }}>{detalhes}</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 28, opacity: 0.88 }}>Triagem por IA, resposta rápida</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              background: 'rgba(255,255,255,0.16)',
              padding: '12px 24px',
              borderRadius: 999,
            }}
          >
            candidate-se em rankea.ai
          </div>
        </div>
      </div>
    ),
    size
  );
}
