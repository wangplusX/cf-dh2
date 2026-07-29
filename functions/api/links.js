export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 仅处理 /api/links
  let links = await env.LINKS_KV.get('links', 'json');
  if (!links) {
    links = getDefaultLinks();
    await env.LINKS_KV.put('links', JSON.stringify(links));
  }

  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'change_me_123';

  // GET：权限判断
  if (method === 'GET') {
    const accessPwd = request.headers.get('X-Access-Password') || '';
    const authToken = request.headers.get('X-Auth-Token') || '';

    // 验证内部 token
    if (authToken) {
      const sessionData = await env.LINKS_KV.get(`session:${authToken}`, 'json');
      if (sessionData && sessionData.expireAt > Date.now()) {
        return new Response(JSON.stringify(links), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    // 验证管理密码
    if (accessPwd === ADMIN_PASSWORD) {
      return new Response(JSON.stringify(links), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // 只返回公开链接
    const publicLinks = links.filter(link => link.public !== false);
    return new Response(JSON.stringify(publicLinks), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 写操作需要管理密码
  const adminPwd = request.headers.get('X-Admin-Password') || '';
  if (adminPwd !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // POST：添加、验证、更新
  if (method === 'POST') {
    try {
      const body = await request.json();
      if (body.action === 'validate') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (body.action === 'update') {
        const { id, title, url: linkUrl, icon = '', isPublic = true } = body;
        const index = links.findIndex(l => l.id === id);
        if (index === -1) {
          return new Response(JSON.stringify({ error: 'Link not found' }), { status: 404 });
        }
        links[index].title = title;
        links[index].url = linkUrl;
        links[index].icon = icon;
        links[index].public = isPublic;
        await env.LINKS_KV.put('links', JSON.stringify(links));
        return new Response(JSON.stringify(links[index]), { status: 200 });
      }
      // 添加新链接
      const { title, url: linkUrl, icon = '', isPublic = true } = body;
      if (!title || !linkUrl) {
        return new Response(JSON.stringify({ error: 'Title and URL required' }), { status: 400 });
      }
      const newLink = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        title,
        url: linkUrl,
        icon,
        public: isPublic
      };
      links.push(newLink);
      await env.LINKS_KV.put('links', JSON.stringify(links));
      return new Response(JSON.stringify(newLink), { status: 201 });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
    }
  }

  // DELETE
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }
    const index = links.findIndex(l => l.id === id);
    if (index === -1) {
      return new Response(JSON.stringify({ error: 'Link not found' }), { status: 404 });
    }
    links.splice(index, 1);
    await env.LINKS_KV.put('links', JSON.stringify(links));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
}

function getDefaultLinks() {
  return [
    { id: '1', title: 'Bing 搜索', url: 'https://cn.bing.com/', public: true },
    { id: '2', title: '豆包 AI', url: 'https://www.doubao.com/chat/', public: true },
    { id: '3', title: 'DeepSeek', url: 'https://chat.deepseek.com/', public: true },
    { id: '4', title: 'IP 查询', url: 'https://iplark.com/', public: true },
    { id: '5', title: 'OneDrive', url: 'https://office.live.com/start/OneDrive.aspx', public: true },
    { id: '6', title: 'Vtool 工具箱', url: 'https://vtool.pro/seal/', public: true },
    { id: '7', title: '临时邮箱', url: 'https://yiyunpro.eu.org/', public: true },
    { id: '8', title: '网络助手', url: 'https://w.toph.top/', public: true },
    { id: '9', title: 'Cloudflare', url: 'https://dash.cloudflare.com/', public: true },
    { id: '10', title: '一加7Pro', url: 'https://www.kancloud.cn/l932539908/a123/2317220', public: true },
    { id: '11', title: 'WPS 会员', url: 'https://personal-act.wps.cn/rubik2/portal/HD2026010517124915/YM2026010517123805?cs_from=wx_wxzzfw_260311_article&position=wx_wxzzfw_260311_article', public: true },
    { id: '12', title: '壁纸工坊', url: 'https://wallpaperscraft.com/', public: true },
    { id: '13', title: '安全生产法', url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/dongtaixinwen/shizhengyaowen/202205/t20220513_448176.html', public: true }
  ];
}
