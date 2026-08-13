import { I18N } from 'astrowind:config';

export const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(I18N?.language, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export const getFormattedDate = (date: Date): string => (date ? formatter.format(date) : '');

export const trim = (str = '', ch?: string) => {
  let start = 0,
    end = str.length || 0;
  while (start < end && str[start] === ch) ++start;
  while (end > start && str[end - 1] === ch) --end;
  return start > 0 || end < str.length ? str.substring(start, end) : str;
};

// Function to format a number in thousands (K) or millions (M) format depending on its value
export const toUiAmount = (amount: number) => {
  if (!amount) return 0;

  let value: string;

  if (amount >= 1000000000) {
    const formattedNumber = (amount / 1000000000).toFixed(1);
    if (Number(formattedNumber) === parseInt(formattedNumber)) {
      value = parseInt(formattedNumber) + 'B';
    } else {
      value = formattedNumber + 'B';
    }
  } else if (amount >= 1000000) {
    const formattedNumber = (amount / 1000000).toFixed(1);
    if (Number(formattedNumber) === parseInt(formattedNumber)) {
      value = parseInt(formattedNumber) + 'M';
    } else {
      value = formattedNumber + 'M';
    }
  } else if (amount >= 1000) {
    const formattedNumber = (amount / 1000).toFixed(1);
    if (Number(formattedNumber) === parseInt(formattedNumber)) {
      value = parseInt(formattedNumber) + 'K';
    } else {
      value = formattedNumber + 'K';
    }
  } else {
    value = Number(amount).toFixed(0);
  }

  return value;
};

// 溢隆模具时间相关常量与动态计算
export const COMPANY_FOUNDATION_YEAR = 2004;
export const INJECTION_BUSINESS_START_YEAR = 2016;

/**
 * 模具制造年数 = 今年 - 2004（默认取当前年份；可传参覆盖用于测试）
 */
export const getMoldYears = (now: Date = new Date()): number => {
  const year = now.getFullYear();
  return Math.max(year - COMPANY_FOUNDATION_YEAR, 0);
};

/**
 * 注塑生产年数 = 今年 - 2016
 */
export const getInjectionYears = (now: Date = new Date()): number => {
  const year = now.getFullYear();
  return Math.max(year - INJECTION_BUSINESS_START_YEAR, 0);
};

/** 带单位的中文简写，常用于文案与数据卡 */
export const moldYearsLabel = (now: Date = new Date()): string => `${getMoldYears(now)}年`;
export const injectionYearsLabel = (now: Date = new Date()): string => `${getInjectionYears(now)}年`;
