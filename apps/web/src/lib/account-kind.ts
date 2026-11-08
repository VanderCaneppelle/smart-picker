import { getAdminEmails } from '@/lib/admin';

/**
 * Classifica uma conta em real, interna (nossas contas de teste) ou robô.
 *
 * Existe porque, sem esse filtro, os números do admin são ficção: em 2026-11 eram
 * 282 contas, das quais umas 257 de robô e umas 20 de teste nossas. A classificação
 * só esconde e separa. Nada aqui apaga conta: apagar é irreversível e uma heurística
 * errada removeria um usuário de verdade.
 */
export type AccountKind = 'real' | 'internal' | 'bot';

/** "fulano+teste3@gmail.com" vira "fulano@gmail.com". */
export function emailBase(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 0) return e;
  return e.slice(0, at).split('+')[0] + e.slice(at);
}

/**
 * E-mails da equipe vêm de env, não do código, porque o repositório é público.
 * INTERNAL_EMAILS (separado por vírgula) soma-se a ADMIN_EMAILS, e qualquer variação
 * com "+algo" de um desses endereços conta como interna.
 */
function internalBases(): Set<string> {
  const extra = (process.env.INTERNAL_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return new Set([...getAdminEmails(), ...extra].map(emailBase));
}

const DOMINIOS_DESCARTAVEIS = [
  '.ml', '.tk', '.ga', '.cf', '.gq',
  'mailinator', 'guerrillamail', 'tempmail', '10minutemail', 'yopmail',
  'throwaway', 'sharklasers', 'dispostable',
];

/**
 * Nome gerado por robô: sem espaço, comprido e com maiúsculas no meio, como
 * "wPVMkoCaNKptcQiE". Mesma regra de scripts/auditar-contas.mjs.
 */
function pareceGerado(nome: string | null | undefined): boolean {
  if (!nome) return false;
  const limpo = nome.trim();
  if (limpo.includes(' ')) return false;
  if (limpo.length < 10) return false;
  const temMaiusculaNoMeio = /[a-z][A-Z]/.test(limpo);
  const proporcaoVogais = (limpo.match(/[aeiouAEIOU]/g) || []).length / limpo.length;
  return temMaiusculaNoMeio && proporcaoVogais < 0.32;
}

function dominioDescartavel(email: string): boolean {
  const e = email.toLowerCase();
  return DOMINIOS_DESCARTAVEIS.some((d) => (d.startsWith('.') ? e.endsWith(d) : e.includes(d)));
}

/**
 * Gmail ignora pontos, e robô usa isso para gerar mil contas do mesmo endereço:
 * "a.bc.d.ef.g1.2@gmail.com". Quatro pontos ou mais no usuário é sinal forte.
 */
function gmailPontilhado(email: string): boolean {
  const [user, domain] = email.toLowerCase().split('@');
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return false;
  return (user.match(/\./g) || []).length >= 4;
}

export interface AccountKindInput {
  email: string;
  name: string | null;
  company: string | null;
  jobs: number;
  /** Assinatura ativa num plano de verdade (não 'test'). */
  paying: boolean;
}

export function accountKindResolver(): (a: AccountKindInput) => AccountKind {
  const bases = internalBases();
  return (a) => {
    if (bases.has(emailBase(a.email))) return 'internal';
    // Quem publicou vaga ou paga nunca é robô, por mais estranho que seja o nome.
    if (a.jobs > 0 || a.paying) return 'real';
    const suspeito =
      pareceGerado(a.name) ||
      pareceGerado(a.company) ||
      dominioDescartavel(a.email) ||
      gmailPontilhado(a.email);
    return suspeito ? 'bot' : 'real';
  };
}

export function isPaying(sub: { status: string; plan: string | null } | null | undefined): boolean {
  return !!sub && sub.status === 'active' && !!sub.plan && sub.plan !== 'test';
}
