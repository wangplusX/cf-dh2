export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 从 KV 读取链接，若不存在则初始化默认数据
  let links = await env.LINKS_KV.get('links', 'json');
  if (!links) {
    links = getDefaultLinks();
    await env.LINKS_KV.put('links', JSON.stringify(links));
  }

  // GET 公开
  if (method === 'GET') {
    return new Response(JSON.stringify(links), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 非 GET 请求验证密码
  const password = request.headers.get('X-Admin-Password') || '';
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'change_me_123';
  if (password !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST：添加链接 或 密码验证
  if (method === 'POST') {
    try {
      const body = await request.json();
      if (body.action === 'validate') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      const { title, url: linkUrl } = body;
      if (!title || !linkUrl) {
        return new Response(JSON.stringify({ error: 'Title and URL required' }), { status: 400 });
      }
      const newLink = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        title,
        url: linkUrl
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
    { id: '1', title: '大商务贯通系统', url: 'https://portal.ctce.com.cn:5001/login' },
    { id: '2', title: '隐患排查系统', url: 'https://riskcheck.ctce.com.cn/riskcheck/CTCE/login.html' },
    { id: '3', title: '公司OA系统', url: 'http://218.22.104.77:8888/Portal/Frame/LayoutE/Default.aspx' },
    { id: '4', title: '四局OA系统', url: 'http://oa.ctce.com.cn/Services/Identification/Server/login.ashx?service=http://oa.ctce.com.cn/Services/Identification/login.ashx&logout=1' },
    { id: '5', title: '出发学习平台', url: 'https://crec4.21tb.com/login/login.init.do?returnUrl=https%3A%2F%2Fcrec4.21tb.com%2Fels%2Fhtml%2Findex.parser.do%3Fid%3DNEW_COURSE_CENTER%26current_app_id%3D8a80810f5ab29060015ad1906d0b3811&elnScreen=1536*864elnScreen' },
    { id: '6', title: '铁安培训平台', url: 'https://www.ztaqpx.com/uc/toIndex' },
    { id: '7', title: '铁安考试平台', url: 'https://ztsj.ztaqpx.com/login' },
    { id: '8', title: '金山文档', url: 'https://www.kdocs.cn/latest?from=docs' },
    { id: '9', title: '腾讯文档', url: 'https://docs.qq.com/desktop/' },
    { id: '10', title: '宁波打印机后台', url: 'http://192.168.110.240/web/guest/cn/websys/webArch/mainFrame.cgi' },
    { id: '11', title: '头门港BIM平台', url: 'https://www.jttlgs.cn/login' },
    { id: '12', title: '铁路施工综合管理平台', url: 'https://sg.railshj.cn/#/home' },
    { id: '13', title: '项综平台', url: 'https://ipmp.ctce.com.cn/login' },
    { id: '14', title: 'bing搜索', url: 'https://cn.bing.com/' },
    { id: '15', title: '豆包AI', url: 'https://www.doubao.com/chat/?channel=jiguangdaohang&source=doutui_cqt_db_jgdh_fjr1yr' },
    { id: '16', title: '简法导航主页', url: 'https://www.jianfast.com/' },
    { id: '17', title: 'deepseek', url: 'https://chat.deepseek.com/sign_in' },
    { id: '18', title: 'IP查询助手', url: 'https://iplark.com/' },
    { id: '19', title: 'onedrive', url: 'https://office.live.com/start/OneDrive.aspx?ui=zh-CN&rs=CN' },
    { id: '20', title: 'vtool工具箱', url: 'https://vtool.pro/seal/' },
    { id: '21', title: '临时邮箱助手', url: 'https://yiyunpro.eu.org/' },
    { id: '22', title: '网络助手', url: 'https://w.toph.top/' },
    { id: '23', title: 'cloudflare', url: 'https://dash.cloudflare.com/' },
    { id: '24', title: '一加7pro', url: 'https://www.kancloud.cn/l932539908/a123/2317220' },
    { id: '25', title: 'WPS尊享会员限时内邀', url: 'https://personal-act.wps.cn/rubik2/portal/HD2026010517124915/YM2026010517123805?cs_from=wx_wxzzfw_260311_article&position=wx_wxzzfw_260311_article' },
    { id: '26', title: 'wallpaperCraft', url: 'https://wallpaperscraft.com/' },
    { id: '27', title: '安全生产法', url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/dongtaixinwen/shizhengyaowen/202205/t20220513_448176.html' }
  ];
}
