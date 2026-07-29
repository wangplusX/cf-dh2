const API_BASE = '/api/links';
const AUTH_BASE = '/api/auth';
const BG_BASE = '/api/bg';
let currentToken = localStorage.getItem('authToken');

window.addEventListener('DOMContentLoaded', () => {
    // 设置背景图
    setBackground();

    // 根据 token 状态加载链接
    if (currentToken) {
        loadLinksWithToken(currentToken);
        document.getElementById('logoutBtn').style.display = 'block';
    } else {
        loadLinks();
    }

    // 搜索功能
    document.getElementById('searchBtn').addEventListener('click', doSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });

    // 内部资源按钮
    document.getElementById('internalBtn').addEventListener('click', () => {
        const box = document.getElementById('internalBox');
        box.style.display = box.style.display === 'none' ? 'flex' : 'none';
    });

    // 内部资源密码提交
    document.getElementById('internalSubmit').addEventListener('click', internalLogin);

    // 退出内部模式
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

async function setBackground() {
    try {
        const res = await fetch(BG_BASE);
        if (res.ok) {
            const data = await res.json();
            if (data.bgImage) {
                document.body.style.backgroundImage = `url('${data.bgImage}')`;
            }
        }
    } catch (e) {
        // 使用默认背景
    }
}

function doSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) window.open(`https://cn.bing.com/search?q=${encodeURIComponent(query)}`, '_blank');
}

async function loadLinksWithToken(token) {
    const container = document.getElementById('linksContainer');
    try {
        const res = await fetch(API_BASE, { headers: { 'X-Auth-Token': token } });
        if (!res.ok) {
            localStorage.removeItem('authToken');
            currentToken = null;
            document.getElementById('logoutBtn').style.display = 'none';
            loadLinks();
            return;
        }
        const links = await res.json();
        renderLinks(links);
    } catch (err) {
        container.innerHTML = '<div class="error">加载失败</div>';
    }
}

async function loadLinks() {
    const container = document.getElementById('linksContainer');
    try {
        const res = await fetch(API_BASE);
        const links = await res.json();
        renderLinks(links);
    } catch (err) {
        container.innerHTML = '<div class="error">加载失败</div>';
    }
}

function renderLinks(links) {
    const container = document.getElementById('linksContainer');
    if (links.length === 0) {
        container.innerHTML = '<div class="loading">暂无链接</div>';
        return;
    }
    container.innerHTML = links.map(link => {
        let domain = '';
        try {
            domain = new URL(link.url).hostname;
        } catch (e) {
            domain = '';   // 如果 URL 格式错误，回退
        }
        const faviconUrl = link.icon || (domain ? `https://a.favicon.im/${domain}` : '');
        const shortTitle = link.title.length > 12 ? link.title.substring(0,12) + '...' : link.title;
        return `
            <div class="link-wrapper">
                <a href="${link.url}" target="_blank" class="link-card" title="${escapeHtml(link.title)}">
                    <img src="${faviconUrl}" alt="" onerror="this.onerror=null;this.src='data:image/svg+xml,...'">
                </a>
                <div class="link-text">${escapeHtml(shortTitle)}</div>
            </div>
        `;
    }).join('');
}

async function internalLogin() {
    const pwd = document.getElementById('internalPwd').value.trim();
    if (!pwd) return;
    try {
        const authRes = await fetch(AUTH_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        if (authRes.status === 401) {
            alert('密码错误');
            return;
        }
        if (!authRes.ok) {
            const errData = await authRes.json().catch(() => ({}));
            alert(errData.error || '验证失败');
            return;
        }
        const { token } = await authRes.json();
        localStorage.setItem('authToken', token);
        currentToken = token;
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('internalBox').style.display = 'none';
        document.getElementById('internalPwd').value = '';
        loadLinksWithToken(token);
    } catch (err) {
        alert('网络错误，请稍后重试');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    currentToken = null;
    document.getElementById('logoutBtn').style.display = 'none';
    loadLinks();
}

function escapeHtml(text) {
    return text.replace(/[&<>"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
    })[m]);
}
