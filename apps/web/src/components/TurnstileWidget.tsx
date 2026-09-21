'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Widget do Turnstile (captcha da Cloudflare) no formulário de cadastro.
 *
 * Se `NEXT_PUBLIC_TURNSTILE_SITE_KEY` não estiver definida, o componente não renderiza
 * nada e avisa o pai que está liberado. É o que permite o código viver em produção
 * antes de a conta da Cloudflare existir, sem travar ninguém no cadastro.
 *
 * O Turnstile foi escolhido por ser invisível na maioria das vezes: o usuário legítimo
 * não resolve quebra-cabeça, só perde alguns milissegundos. Um captcha que atrapalha
 * gente de verdade num produto sem tração custa mais do que o lixo que ele barra.
 */

interface TurnstileWidgetProps {
  /** Recebe o token quando resolvido, e null quando expira ou falha. */
  onToken: (token: string | null) => void;
  className?: string;
}

interface JanelaComTurnstile extends Window {
  turnstile?: {
    render: (
      elemento: HTMLElement,
      opcoes: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
      }
    ) => string;
    remove: (id: string) => void;
  };
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function TurnstileWidget({ onToken, className = '' }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    // Sem chave, o pai precisa saber que pode enviar mesmo assim.
    if (!siteKey) {
      onToken(null);
      return;
    }

    let cancelado = false;

    const renderizar = () => {
      const janela = window as JanelaComTurnstile;
      if (cancelado || !janela.turnstile || !containerRef.current) return;
      if (widgetIdRef.current) return;

      widgetIdRef.current = janela.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => {
          setErro(true);
          onToken(null);
        },
      });
    };

    const existente = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existente) {
      if ((window as JanelaComTurnstile).turnstile) renderizar();
      else existente.addEventListener('load', renderizar);
    } else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderizar);
      script.addEventListener('error', () => {
        // Cloudflare fora do ar não pode impedir cadastro: o servidor ainda valida, e
        // lá a falha de rede também deixa passar.
        setErro(true);
        onToken(null);
      });
      document.head.appendChild(script);
    }

    return () => {
      cancelado = true;
      const janela = window as JanelaComTurnstile;
      if (widgetIdRef.current && janela.turnstile) {
        janela.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return (
    <div className={className}>
      <div ref={containerRef} />
      {erro && (
        <p className="mt-1 text-xs text-gray-500">
          Não foi possível carregar a verificação. Você ainda pode continuar.
        </p>
      )}
    </div>
  );
}
