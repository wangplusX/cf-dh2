const API_BASE = '/api/links';

document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doSearch();
});

function doSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) window.open(`https://cn.bing.com/search?q=${encodeURIComponent(query)}`, '_blank');
}

async function loadLinks() {
    const container = document.getElementById('linksContainer');
    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('获取失败');
        const links = await res.json();
        if (links.length === 0) {
            container.innerHTML = '<div class="loading">暂无链接，请前往后台添加</div>';
            return;
        }
        container.innerHTML = links.map(link => {
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=64`;
            return `
                <a href="${link.url}" target="_blank" class="link-card" title="${escapeHtml(link.title)}">
                    <img src="${faviconUrl}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect width=%2240%22 height=%2240%22 rx=%228%22 fill=%22%23ddd%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 font-size=%2218%22 fill=%22%23999%22>🔗</text></svg>'">
                    <span>${escapeHtml(link.title)}</span>
                </a>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<div class="error">加载失败，请稍后重试</div>';
    }
}

function escapeHtml(text) {
    return text.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]);
}

loadLinks();
