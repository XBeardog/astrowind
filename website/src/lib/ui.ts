// 简单的 UI 交互工具（主站共用）

/** 绑定 tabs 切换：.tab-btn[data-tab="xxx"] 控制 .tab-content#tab-xxx 的显隐 */
export function bindTabs(root: ParentNode = document) {
  const buttons = root.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const contents = root.querySelectorAll<HTMLElement>('.tab-content');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (!tab) return;
      buttons.forEach((b) => {
        b.classList.remove('border-primary', 'text-primary');
        b.classList.add('border-transparent', 'text-gray-500', 'dark:text-slate-400');
      });
      btn.classList.add('border-primary', 'text-primary');
      btn.classList.remove('border-transparent', 'text-gray-500', 'dark:text-slate-400');
      contents.forEach((c) => {
        if (c.id === `tab-${tab}`) c.classList.remove('hidden');
        else c.classList.add('hidden');
      });
    });
  });
}

/** 朋友圈动态条目（与后端 /api/products/moments/list 返回结构一致） */
export interface MomentItem {
  id?: number;
  content?: string;
  images?: string[];
  created_at?: string;
}

const escHTML = (s: any) =>
  String(s == null ? '' : s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );

/** 相对时间：刚刚 / N分钟前 / N小时前 / 昨天 / N天前 / 日期 */
export function formatRelativeTime(input?: string | number | Date, now: Date = new Date()): string {
  if (!input) return '';
  let s = String(input);
  // 兼容 SQLite datetime('now') 的 "YYYY-MM-DD HH:mm:ss"（UTC）
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z';
  const d = input instanceof Date ? input : new Date(s);
  if (isNaN(d.getTime())) return String(input);
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;
  const day = Math.floor(hour / 24);
  if (day === 1) return '昨天';
  if (day < 7) return `${day}天前`;
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function momentImagesHTML(images: string[]) {
  const cols = images.length === 1 ? 1 : images.length === 2 || images.length === 4 ? 2 : 3;
  return `<div class="mm-imgs" data-count="${images.length}" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">
    ${images
      .map(
        (u) =>
          `<button type="button" class="mm-img" data-lightbox="${escHTML(u)}" aria-label="查看大图"><img src="${escHTML(u)}" alt="" loading="lazy"/></button>`
      )
      .join('')}
  </div>`;
}

/** 渲染朋友圈式动态流（服务端 SSR 与客户端复用同一份 HTML） */
export function renderMomentFeed(items: MomentItem[], opts: { now?: Date } = {}): string {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return '<div class="mm-empty">还没有动态，敬请期待～</div>';
  }
  return list
    .map((m) => {
      const images = (Array.isArray(m.images) ? m.images : []).filter(Boolean);
      const time = formatRelativeTime(m.created_at, opts.now);
      return `<article class="mm-card">
        <div class="mm-avatar" aria-hidden="true">溢</div>
        <div class="mm-body">
          <div class="mm-name">溢隆模具</div>
          ${m.content ? `<p class="mm-text">${escHTML(m.content)}</p>` : ''}
          ${images.length ? momentImagesHTML(images) : ''}
          <div class="mm-meta"><time title="${escHTML(m.created_at || '')}">${escHTML(time)}</time></div>
        </div>
      </article>`;
    })
    .join('');
}

/** 点击动态图片查看大图（全局只绑定一次） */
export function bindLightbox(root: ParentNode = document) {
  const host: any = root;
  if (host.__mmLightboxBound) return;
  host.__mmLightboxBound = true;
  host.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement | null;
    const btn = target?.closest?.('[data-lightbox]') as HTMLElement | null;
    if (!btn) return;
    const url = btn.getAttribute('data-lightbox');
    if (!url) return;
    let overlay = document.querySelector('.mm-lightbox') as HTMLElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'mm-lightbox';
      overlay.innerHTML = '<img alt=""/>';
      overlay.addEventListener('click', () => overlay?.remove());
      document.body.appendChild(overlay);
    }
    const img = overlay.querySelector('img') as HTMLImageElement | null;
    if (img) img.src = url;
  });
}
