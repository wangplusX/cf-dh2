export async function onRequest(context) {
  const { request, env } = context;

  // 仅允许 POST 方法
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { password } = body;
    const INTERNAL_PASSWORD = env.INTERNAL_PASSWORD || 'internal123';

    if (password !== INTERNAL_PASSWORD) {
      return new Response(JSON.stringify({ error: '密码错误' }), { status: 401 });
    }

    const token = crypto.randomUUID();
    const expireAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await env.LINKS_KV.put(`session:${token}`, JSON.stringify({ expireAt }), {
      expirationTtl: 30 * 24 * 60 * 60
    });

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
}
