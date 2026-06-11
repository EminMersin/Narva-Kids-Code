import { describe, expect, test } from 'vitest';
import type { WebDocumentNode, WebLevelData } from '../../modules/levels/schema';
import { parseWebDocument, renderWebPreview, validateWebLevel } from '../../modules/web/engine';

function level(overrides: Partial<WebLevelData> = {}): WebLevelData {
  return {
    kind: 'web',
    id: 'web_html_easy_999',
    world: 'web_html',
    mode: 'easy',
    order: 999,
    title: 'Test Web Level',
    learningOutcome: 'HTML yapısını doğrular.',
    concept: 'html_structure',
    childIntro: 'Test',
    availableTags: ['html', 'head', 'title', 'body', 'h1', 'p', 'div'],
    availableStyles: ['color'],
    web: {
      requiredTags: ['html', 'head', 'title', 'body', 'h1'],
      titleText: 'İlk Sayfam',
      visibleText: ['Merhaba Dünya'],
    },
    starRules: {
      oneStar: { mustComplete: true },
      twoStars: { maxCommands: 8 },
      threeStars: { maxCommands: 5 },
    },
    hints: ['Önce HTML iskeletini kur.'],
    solution: {
      logic: 'Test',
      commands: [],
      htmlCode: '',
      cssCode: '',
      document: [],
    },
    ...overrides,
  };
}

const validDocument: WebDocumentNode[] = [
  {
    tag: 'html',
    children: [
      { tag: 'head', children: [{ tag: 'title', text: 'İlk Sayfam' }] },
      { tag: 'body', children: [{ tag: 'h1', text: 'Merhaba Dünya' }] },
    ],
  },
];

describe('Web engine', () => {
  test('accepts h1 inside body and renders preview', () => {
    const result = validateWebLevel(level(), validDocument);
    const preview = renderWebPreview(validDocument);

    expect(result.completed).toBe(true);
    expect(preview).toContain('<h1>Merhaba Dünya</h1>');
  });

  test('rejects title inside body with a child-friendly error', () => {
    const result = validateWebLevel(level(), [
      {
        tag: 'html',
        children: [
          { tag: 'head', children: [] },
          { tag: 'body', children: [{ tag: 'title', text: 'Yanlış Yer' }, { tag: 'h1', text: 'Merhaba Dünya' }] },
        ],
      },
    ]);

    expect(result.completed).toBe(false);
    expect(result.errors.join(' ')).toContain('Sekme Başlığı bloğu Body içine konamaz');
  });

  test('rejects visible content outside body', () => {
    const result = validateWebLevel(level(), [
      {
        tag: 'html',
        children: [
          { tag: 'head', children: [{ tag: 'title', text: 'İlk Sayfam' }, { tag: 'h1', text: 'Merhaba Dünya' }] },
          { tag: 'body', children: [] },
        ],
      },
    ]);

    expect(result.completed).toBe(false);
    expect(result.errors.join(' ')).toContain('Görünen Başlık bloğu Head içine konamaz');
  });

  test('rejects unavailable CSS properties', () => {
    const result = validateWebLevel(level(), [
      {
        tag: 'html',
        children: [
          { tag: 'head', children: [{ tag: 'title', text: 'İlk Sayfam' }] },
          { tag: 'body', children: [{ tag: 'h1', text: 'Merhaba Dünya', styles: { margin: '12px' } }] },
        ],
      },
    ]);

    expect(result.completed).toBe(false);
    expect(result.errors.join(' ')).toContain('dış boşluk bu seviyede kullanılamaz');
  });

  test('parses editable HTML code into the same web document model', () => {
    const parsed = parseWebDocument(`<!doctype html>
<html>
  <head>
    <title>İlk Sayfam</title>
  </head>
  <body>
    <h1 style="color: #2563eb">Merhaba Dünya</h1>
  </body>
</html>`);

    expect(parsed.errors).toEqual([]);
    expect(validateWebLevel(level(), parsed.nodes).completed).toBe(true);
    expect(parsed.nodes[0]?.children?.[1]?.children?.[0]?.styles?.color).toBe('#2563eb');
  });

  test('rejects unsupported tags while parsing manual HTML code', () => {
    const parsed = parseWebDocument('<html><body><script>alert(1)</script></body></html>');

    expect(parsed.errors.join(' ')).toContain('script etiketi bu oyunda kullanılmıyor');
  });
});
