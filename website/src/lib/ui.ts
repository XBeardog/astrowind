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
