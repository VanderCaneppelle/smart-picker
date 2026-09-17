import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse, type AuthUser } from '@/lib/auth';

/**
 * Quem é admin vem da env ADMIN_EMAILS (lista separada por vírgula), não do banco.
 * Motivo: não exige migração, não existe tela para promover ninguém (o que seria uma
 * superfície de escalação de privilégio) e um admin só se cria com acesso ao deploy.
 * Se um dia precisar de mais de um nível de acesso, aí sim vira coluna no Recruiter.
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.toLowerCase());
}

export type AdminGuard = { user: AuthUser } | { response: Response };

/**
 * Separa os dois "não" de propósito:
 * - sem sessão válida devolve 401, para o cliente mandar a pessoa ao login;
 * - com sessão e sem ser admin devolve 404, porque a área não existe para ela.
 * Tratar os dois como 404 esconde bug de autenticação atrás de falta de permissão.
 */
export async function guardAdmin(request: NextRequest): Promise<AdminGuard> {
  const user = await verifyAuth(request);
  if (!user) return { response: unauthorizedResponse() };
  if (!isAdminEmail(user.email)) return { response: adminNotFoundResponse() };
  return { user };
}

/**
 * 404 em vez de 403 de propósito: para quem não é admin, a área simplesmente não
 * existe. Um 403 confirmaria que o endpoint existe e convidaria a insistir.
 */
export function adminNotFoundResponse() {
  return Response.json({ error: 'Not Found', message: 'Not Found' }, { status: 404 });
}
