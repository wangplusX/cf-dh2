const API_BASE = '/api/links';
const AUTH_BASE = '/api/auth';
let currentToken = localStorage.getItem('authToken');   // 读取本地 token

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    if (currentToken) {
        // 已有 token，自动加载全部链接
        loadLinksWithToken(currentToken);
        document.getElementById('logoutBtn').style.display = 'inline-block';
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

    // 密码提交
    document.getElementById('internalSubmit').addEventListener('click', internalLogin);

    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

function doSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) window.open(`https://cn.bing.com/search?q=${encodeURIComponent(query)}`, '_blank');
}

// 使用 token 获取全部链接
async function loadLinksWithToken(token) {
    const container = document.getElementById('linksContainer');
    try {
        const res = await fetch(API_BASE, {
            headers: { 'X-Auth-Token': token }
        });
        if (res.status === 401 || !res.ok) {
            // token 无效或过期，清除并回退
            localStorage.removeItem('authToken');
            currentToken = null;
            document.getElementById('logoutBtn').style.display = 'none';
            loadLinks();   // 重新加载公开链接
            return;
        }
        const links = await res.json();
        renderLinks(links);
    } catch (err) {
        container.innerHTML = '<div class="error">加载失败</div>';
    }
}

// 无 token 时加载公开链接
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
        const faviconUrl = link.icon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=64`;
        const shortTitle = link.title.length > 6 ? link.title.substring(0,6) + '...' : link.title;
        return `
            <div class="link-wrapper">
                <a href="${link.url}" target="_blank" class="link-card" title="${escapeHtml(link.title)}">
                    <img src="${faviconUrl}" alt="" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect width=%2240%22 height=%2240%22 rx=%228%22 fill=%22%23ddd%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 font-size=%2218%22 fill=%22%23999%22>🔗</text></svg>'">
                </a>
                <div class="link-text">${escapeHtml(shortTitle)}</div>
            </div>
        `;
    }).join('');
}

// 内部资源登录验证
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
        const { token } = await authRes.json();
        // 保存 token 到本地
        localStorage.setItem('authToken', token);
        currentToken = token;
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('internalBox').style.display = 'none';
        document.getElementById('internalPwd').value = '';
        // 刷新链接列表
        loadLinksWithToken(token);
    } catch (err) {
        alert('验证失败，请稍后重试');
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('authToken');
    currentToken = null;
    document.getElementById('logoutBtn').style.display = 'none';
    loadLinks();   // 重新加载公开链接
}

function escapeHtml(text) {
    return text.replace(/[&<>"]/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    })[m]);
}
