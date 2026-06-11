import type { WebDocumentNode, WebLevelData, WebStyleProperty, WebTag } from '@/modules/levels/schema';

export interface WebValidationResult {
  valid: boolean;
  completed: boolean;
  errors: string[];
  commandCount: number;
}

export interface WebParseResult {
  nodes: WebDocumentNode[];
  errors: string[];
}

const CONTAINER_TAGS = new Set<WebTag>(['html', 'head', 'body', 'ul', 'div', 'section']);
const VISIBLE_BODY_TAGS = new Set<WebTag>(['h1', 'h2', 'p', 'strong', 'br', 'img', 'a', 'ul', 'li', 'div', 'section', 'button']);
const WEB_TAGS = new Set<WebTag>([
  'html',
  'head',
  'title',
  'body',
  'h1',
  'h2',
  'p',
  'strong',
  'br',
  'img',
  'a',
  'ul',
  'li',
  'div',
  'section',
  'button',
]);
const ALLOWED_STYLE_VALUES: Record<WebStyleProperty, RegExp> = {
  color: /^#[0-9a-fA-F]{6}$|^[a-zA-Z]+$/,
  'background-color': /^#[0-9a-fA-F]{6}$|^[a-zA-Z]+$/,
  'font-size': /^\d{1,2}px$/,
  'text-align': /^(left|center|right)$/,
  padding: /^\d{1,2}px$/,
  margin: /^\d{1,2}px$/,
  border: /^\dpx solid #[0-9a-fA-F]{6}$/,
  'border-radius': /^\d{1,2}px$/,
};

export function createWebNode(tag: WebTag): WebDocumentNode {
  const base: WebDocumentNode = {
    id: `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tag,
    children: CONTAINER_TAGS.has(tag) ? [] : undefined,
  };

  if (tag === 'title') return { ...base, text: 'İlk Sayfam' };
  if (tag === 'h1') return { ...base, text: 'Merhaba Dünya' };
  if (tag === 'h2') return { ...base, text: 'Alt Başlık' };
  if (tag === 'p') return { ...base, text: 'Bu benim ilk web sayfam.' };
  if (tag === 'strong') return { ...base, text: 'Önemli metin' };
  if (tag === 'button') return { ...base, text: 'Tıkla' };
  if (tag === 'a') return { ...base, text: 'Bağlantı', attrs: { href: '#' } };
  if (tag === 'img') return { ...base, attrs: { src: '', alt: 'Görsel açıklaması' } };
  if (tag === 'li') return { ...base, text: 'Liste maddesi' };
  return base;
}

export function countWebNodes(nodes: WebDocumentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countWebNodes(node.children ?? []), 0);
}

export function renderWebDocument(nodes: WebDocumentNode[]): string {
  return nodes.map((node) => renderNode(node, 0)).join('\n');
}

export function renderWebPreview(nodes: WebDocumentNode[]): string {
  const html = renderWebDocument(nodes);
  if (nodes.some((node) => node.tag === 'html')) return `<!doctype html>\n${html}`;
  return `<!doctype html>\n<html>\n  <body>\n${html.split('\n').map((line) => `    ${line}`).join('\n')}\n  </body>\n</html>`;
}

export function parseWebDocument(source: string): WebParseResult {
  const errors: string[] = [];
  const roots: WebDocumentNode[] = [];
  const stack: WebDocumentNode[] = [];
  const cleanSource = source
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  const tokenPattern = /<\/?[a-zA-Z][\w-]*(?:\s[^<>]*)?>|[^<]+/g;
  const tokens = cleanSource.match(tokenPattern) ?? [];

  tokens.forEach((token) => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;

    if (!trimmedToken.startsWith('<')) {
      appendText(stack.at(-1), trimmedToken);
      return;
    }

    if (trimmedToken.startsWith('</')) {
      const tag = trimmedToken.slice(2, -1).trim().toLowerCase();
      const active = stack.at(-1);
      if (!active) {
        errors.push(`${tag} kapanış etiketi için önce açılış etiketi olmalı.`);
        return;
      }
      if (active.tag !== tag) {
        errors.push(`${tagLabel(active.tag)} bloğunu kapatmadan ${tag} kapatılamaz.`);
        return;
      }
      stack.pop();
      return;
    }

    const match = trimmedToken.match(/^<([a-zA-Z][\w-]*)([^>]*)>$/);
    if (!match) {
      errors.push('HTML etiketlerinden biri okunamadı.');
      return;
    }

    const tag = match[1].toLowerCase() as WebTag;
    if (!WEB_TAGS.has(tag)) {
      errors.push(`${match[1]} etiketi bu oyunda kullanılmıyor.`);
      return;
    }

    const node = createParsedWebNode(tag, parseAttrs(match[2] ?? ''));
    const parent = stack.at(-1);
    if (parent) {
      parent.children = [...(parent.children ?? []), node];
    } else {
      roots.push(node);
    }

    const selfClosing = /\/>$/.test(trimmedToken) || tag === 'br' || tag === 'img';
    if (!selfClosing) stack.push(node);
  });

  [...stack].reverse().forEach((node) => {
    errors.push(`${tagLabel(node.tag)} bloğunun kapanış etiketi eksik.`);
  });

  return { nodes: roots, errors };
}

export function validateWebLevel(level: WebLevelData, nodes: WebDocumentNode[]): WebValidationResult {
  const errors: string[] = [];
  const commandCount = countWebNodes(nodes);
  const htmlNodes = nodes.filter((node) => node.tag === 'html');

  if (htmlNodes.length === 0) {
    errors.push('Önce HTML bloğunu çalışma alanına ekle.');
  }
  if (htmlNodes.length > 1) {
    errors.push('Sayfada yalnızca bir HTML bloğu olmalı.');
  }

  const html = htmlNodes[0];
  const head = findDirectChild(html, 'head');
  const body = findDirectChild(html, 'body');

  if (html) {
    if (!head) errors.push('HTML bloğunun içine Head bloğu ekle.');
    if (!body) errors.push('HTML bloğunun içine Body bloğu ekle.');
  }

  validateStructure(nodes, null, errors);
  validateStyleAllowList(level, nodes, errors);

  const flat = flattenNodes(nodes);
  level.web.requiredTags.forEach((tag) => {
    if (!flat.some((node) => node.tag === tag)) {
      errors.push(`${tagLabel(tag)} bloğunu eklemeyi unutma.`);
    }
  });

  if (level.web.titleText && !flat.some((node) => node.tag === 'title' && normalize(node.text) === normalize(level.web.titleText))) {
    errors.push(`Sekme başlığı "${level.web.titleText}" olmalı.`);
  }

  (level.web.visibleText ?? []).forEach((text) => {
    if (!flat.some((node) => VISIBLE_BODY_TAGS.has(node.tag) && normalize(node.text).includes(normalize(text)))) {
      errors.push(`Sayfada "${text}" yazısı görünmeli.`);
    }
  });

  (level.web.requiredStyles ?? []).forEach((rule) => {
    const target = flat.find((node) => node.tag === rule.tag && node.styles?.[rule.property]);
    if (!target) {
      errors.push(`${tagLabel(rule.tag)} bloğunda ${styleLabel(rule.property)} ayarı olmalı.`);
      return;
    }
    if (rule.value && target.styles?.[rule.property] !== rule.value) {
      errors.push(`${tagLabel(rule.tag)} için ${styleLabel(rule.property)} değeri ${rule.value} olmalı.`);
    }
  });

  return {
    valid: errors.length === 0,
    completed: errors.length === 0,
    errors,
    commandCount,
  };
}

export function canContain(parent: WebTag | null, child: WebTag): boolean {
  if (!parent) return child === 'html';
  if (parent === 'html') return child === 'head' || child === 'body';
  if (parent === 'head') return child === 'title';
  if (parent === 'body') return VISIBLE_BODY_TAGS.has(child);
  if (parent === 'ul') return child === 'li';
  if (parent === 'div' || parent === 'section') return VISIBLE_BODY_TAGS.has(child) && child !== 'li';
  return false;
}

export function tagLabel(tag: WebTag): string {
  const labels: Record<WebTag, string> = {
    html: 'HTML',
    head: 'Head',
    title: 'Sekme Başlığı',
    body: 'Body',
    h1: 'Görünen Başlık',
    h2: 'Alt Başlık',
    p: 'Paragraf',
    strong: 'Kalın Metin',
    br: 'Satır Boşluğu',
    img: 'Görsel',
    a: 'Bağlantı',
    ul: 'Liste',
    li: 'Liste Maddesi',
    div: 'Kutu',
    section: 'Bölüm',
    button: 'Buton',
  };
  return labels[tag];
}

export function styleLabel(property: WebStyleProperty): string {
  const labels: Record<WebStyleProperty, string> = {
    color: 'yazı rengi',
    'background-color': 'arka plan rengi',
    'font-size': 'yazı boyutu',
    'text-align': 'hizalama',
    padding: 'iç boşluk',
    margin: 'dış boşluk',
    border: 'kenarlık',
    'border-radius': 'köşe yuvarlama',
  };
  return labels[property];
}

function renderNode(node: WebDocumentNode, depth: number): string {
  const indent = '  '.repeat(depth);
  const attrs = renderAttrs(node);
  if (node.tag === 'br') return `${indent}<br>`;
  if (node.tag === 'img') return `${indent}<img${attrs}>`;

  const children = node.children ?? [];
  const text = escapeHtml(node.text ?? '');
  if (!children.length) return `${indent}<${node.tag}${attrs}>${text}</${node.tag}>`;

  return [
    `${indent}<${node.tag}${attrs}>`,
    ...children.map((child) => renderNode(child, depth + 1)),
    `${indent}</${node.tag}>`,
  ].join('\n');
}

function renderAttrs(node: WebDocumentNode): string {
  const attrs = { ...(node.attrs ?? {}) };
  const style = renderStyle(node.styles);
  if (style) attrs.style = style;
  return Object.entries(attrs)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => ` ${key}="${escapeAttr(value)}"`)
    .join('');
}

function createParsedWebNode(
  tag: WebTag,
  parsed: { attrs: Record<string, string>; styles: Partial<Record<WebStyleProperty, string>> },
): WebDocumentNode {
  return {
    id: `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tag,
    attrs: Object.keys(parsed.attrs).length ? parsed.attrs : undefined,
    children: CONTAINER_TAGS.has(tag) ? [] : undefined,
    styles: Object.keys(parsed.styles).length ? parsed.styles : undefined,
  };
}

function parseAttrs(rawAttrs: string): { attrs: Record<string, string>; styles: Partial<Record<WebStyleProperty, string>> } {
  const attrs: Record<string, string> = {};
  const styles: Partial<Record<WebStyleProperty, string>> = {};
  const attrPattern = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    const key = match[1].toLowerCase();
    const value = unescapeHtml(match[3] ?? match[4] ?? '');
    if (key === 'style') {
      value.split(';').forEach((entry) => {
        const [property, ...rest] = entry.split(':');
        const normalizedProperty = property?.trim().toLowerCase() as WebStyleProperty;
        const styleValue = rest.join(':').trim();
        if (ALLOWED_STYLE_VALUES[normalizedProperty] && styleValue) {
          styles[normalizedProperty] = styleValue;
        }
      });
      continue;
    }
    if (key === 'href' || key === 'src' || key === 'alt') {
      attrs[key] = value;
    }
  }

  return { attrs, styles };
}

function appendText(node: WebDocumentNode | undefined, text: string): void {
  if (!node) return;
  const nextText = unescapeHtml(text.replace(/\s+/g, ' ').trim());
  if (!nextText) return;
  node.text = node.text ? `${node.text} ${nextText}` : nextText;
}

function renderStyle(styles?: Partial<Record<WebStyleProperty, string>>): string {
  if (!styles) return '';
  return Object.entries(styles)
    .filter((entry): entry is [WebStyleProperty, string] => Boolean(entry[1]))
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ');
}

function validateStructure(nodes: WebDocumentNode[], parent: WebTag | null, errors: string[]): void {
  nodes.forEach((node) => {
    if (!canContain(parent, node.tag)) {
      errors.push(parent ? `${tagLabel(node.tag)} bloğu ${tagLabel(parent)} içine konamaz.` : 'Çalışma alanının en üstünde HTML bloğu olmalı.');
    }
    validateStructure(node.children ?? [], node.tag, errors);
  });
}

function validateStyleAllowList(level: WebLevelData, nodes: WebDocumentNode[], errors: string[]): void {
  flattenNodes(nodes).forEach((node) => {
    Object.entries(node.styles ?? {}).forEach(([property, value]) => {
      const styleProperty = property as WebStyleProperty;
      if (!level.availableStyles.includes(styleProperty)) {
        errors.push(`${styleLabel(styleProperty)} bu seviyede kullanılamaz.`);
        return;
      }
      if (!ALLOWED_STYLE_VALUES[styleProperty]?.test(value)) {
        errors.push(`${styleLabel(styleProperty)} değeri güvenli görünmüyor.`);
      }
    });
  });
}

function findDirectChild(node: WebDocumentNode | undefined, tag: WebTag): WebDocumentNode | undefined {
  return node?.children?.find((child) => child.tag === tag);
}

function flattenNodes(nodes: WebDocumentNode[]): WebDocumentNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])]);
}

function normalize(value?: string): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}
