import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return Response.json(
      { error: 'Bad Request', message: 'session_id is required' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.pre_signup !== '1') {
      return Response.json(
        { error: 'Bad Request', message: 'Not a pre-signup session' },
        { status: 400 }
      );
    }

    return Response.json({
      email: session.customer_details?.email ?? session.customer_email ?? null,
      plan_id: session.metadata?.plan_id ?? null,
      status: session.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve session';
    return Response.json({ error: 'Not Found', message }, { status: 404 });
  }
}
