/**
 * Eventos de funil.
 *
 * O produto tinha só o Clarity, que grava sessão mas não responde a pergunta que
 * decide o próximo passo: de cada cem pessoas que se cadastram, quantas publicam
 * vaga, quantas recebem candidato e quantas assinam. Sem isso, qualquer decisão de
 * marketing é palpite, e o plano inteiro trabalha no escuro.
 *
 * A lista de eventos é fechada de propósito. Evento solto com nome inventado em cada
 * tela é como um painel de analytics morre: seis meses depois ninguém sabe quais
 * nomes existem nem o que cada um significa.
 *
 * "primeiro candidato de uma vaga" não está aqui de propósito. Ele acontece no
 * servidor, quando um estranho envia a candidatura, e o navegador do recrutador não
 * tem como saber disso na hora. Emitir do lado dele no próximo carregamento mediria
 * outra coisa e daria um número errado com cara de certo. Esse indicador sai de
 * consulta ao banco, não do analytics de navegador.
 */
export type EventoFunil =
  | 'signup'
  | 'vaga_criada'
  | 'vaga_publicada'
  | 'link_vaga_copiado'
  | 'curriculos_importados'
  | 'ranking_visto'
  | 'candidatura_enviada'
  | 'checkout_iniciado'
  | 'assinou';

type Propriedades = Record<string, string | number | boolean | undefined>;

interface JanelaComAnalytics extends Window {
  gtag?: (comando: string, evento: string, props?: Record<string, unknown>) => void;
  clarity?: (comando: string, ...args: unknown[]) => void;
}

/**
 * Manda o evento para quem estiver configurado. Nunca lança: analytics que quebra a
 * tela é pior do que analytics que falta, e esta função é chamada de dentro de fluxos
 * que o usuário precisa concluir (criar vaga, assinar, se candidatar).
 */
export function registrarEvento(evento: EventoFunil, props: Propriedades = {}): void {
  if (typeof window === 'undefined') return;

  try {
    const janela = window as JanelaComAnalytics;

    janela.gtag?.('event', evento, props);

    // O Clarity já está instalado e aceita marcação de sessão sem custo nenhum. Serve
    // para filtrar as gravações por etapa do funil, que é onde ele é realmente bom.
    janela.clarity?.('event', evento);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[funil]', evento, props);
    }
  } catch {
    // Silêncio proposital: ver comentário acima.
  }
}
