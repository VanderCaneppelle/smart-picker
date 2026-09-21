import { ImageResponse } from 'next/og';

/**
 * Imagem que aparece quando alguém compartilha o Rankea no WhatsApp, LinkedIn ou
 * Slack. Antes disto não existia nenhuma, e o link saía como um retângulo cinza, o
 * que faz o produto parecer abandonado justamente no momento em que está sendo
 * indicado por alguém.
 *
 * Gerada em código, sem arquivo de design: um PNG estático precisaria ser refeito a
 * cada mudança de texto, e aqui o conteúdo acompanha o repositório.
 */
export const alt = 'Rankea: triagem de currículos com IA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, opacity: 0.9 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            R
          </div>
          rankea.ai
        </div>

        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1, marginTop: 40 }}>
          Currículo lido e ranqueado
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>antes do seu café</div>

        <div style={{ fontSize: 34, marginTop: 36, opacity: 0.92, lineHeight: 1.4 }}>
          A IA lê cada currículo, dá nota por aderência à vaga e devolve o ranking com o
          porquê de cada nota.
        </div>
      </div>
    ),
    size
  );
}
