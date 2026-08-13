import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: '首页',
      href: getPermalink('/'),
    },
    {
      text: '产品中心',
      href: getPermalink('/products'),
    },
    {
      text: '业务服务',
      href: getPermalink('/services'),
    },
    {
      text: '工厂实拍',
      href: getPermalink('/factory'),
    },
    {
      text: '关于我们',
      href: getPermalink('/about'),
    },
    {
      text: '联系我们',
      href: getPermalink('/contact'),
    },
  ],
  actions: [{ text: '立即询盘', href: '/contact', variant: 'primary' as const }],
};

export const footerData = {
  links: [
    {
      title: '业务服务',
      i18n: 'footer.services',
      links: [
        { text: '模具设计制造', href: getPermalink('/services'), i18n: 'footer.mold-design' },
        { text: '注塑成型生产', href: getPermalink('/services'), i18n: 'footer.injection' },
        { text: '试模检测', href: getPermalink('/services'), i18n: 'footer.mold-testing' },
        { text: '定制服务', href: getPermalink('/services'), i18n: 'footer.custom' },
      ],
    },
    {
      title: '关于我们',
      i18n: 'footer.about',
      links: [
        { text: '公司介绍', href: getPermalink('/about'), i18n: 'footer.company' },
        { text: '企业文化', href: getPermalink('/about'), i18n: 'footer.culture' },
        { text: '设备实力', href: getPermalink('/about'), i18n: 'footer.equipment' },
        { text: '工厂实拍', href: getPermalink('/factory'), i18n: 'footer.factory' },
      ],
    },
    {
      title: '联系我们',
      i18n: 'footer.contact',
      links: [
        { text: '询盘留言', href: getPermalink('/contact'), i18n: 'footer.inquiry' },
        { text: '公司动态', href: getPermalink('/factory#news'), i18n: 'footer.news' },
        { text: '+86 132 8884 8848', href: 'tel:+8613288848848' },
      ],
    },
  ],
  secondaryLinks: [
    { text: '服务条款', href: getPermalink('/terms'), i18n: 'footer.terms' },
    { text: '隐私政策', href: getPermalink('/privacy'), i18n: 'footer.privacy' },
  ],
  socialLinks: [
    { ariaLabel: '微信', icon: 'tabler:brand-wechat', href: '#' },
    { ariaLabel: '微博', icon: 'tabler:brand-weibo', href: '#' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: '#' },
    { ariaLabel: 'YouTube', icon: 'tabler:brand-youtube', href: '#' },
  ],
  footNote: `
    © 2024 东莞市溢隆模具有限公司. 保留所有权利.
  `,
};
