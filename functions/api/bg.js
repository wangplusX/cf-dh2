export async function onRequest(context) {
  const { request, env } = context;
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'change_me_123';

  // GET：公开获取背景图 URL
  if (request.method === 'GET') {
    const bgImage = await env.LINKS_KV.get('bgImage') || 
      'https://www.jianfast.com/uploads/bg/230102/1c8f0b78ba907161d7f63ba7a28e1617.jpg';
    return new Response(JSON.stringify({ bgImage }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST：设置背景图（需管理密码）
  if (request.method === 'POST') {
    const adminPwd = request.headers.get('X-Admin-Password') || '';
    if (adminPwd !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    try {
      const body = await request.json();
      const { bgImage } = body;
      if (!bgImage) {
        return new Response(JSON.stringify({ error: 'Missing bgImage' }), { status: 400 });
      }
      await env.LINKS_KV.put('bgImage', bgImage);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
    }
  }

  // 其他方法拒绝
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
