import type { LevelMode, WebDocumentNode, WebLevelData, WebStyleProperty, WebTag } from './schema';
import { renderWebDocument } from '../web/engine';

type WebWorldId =
  | 'web_html'
  | 'web_text'
  | 'web_media'
  | 'web_structure'
  | 'web_css'
  | 'web_box'
  | 'web_challenge';

interface WebTask {
  world: WebWorldId;
  mode: LevelMode;
  title: string;
  learningOutcome: string;
  concept: string;
  childIntro: string;
  availableTags: WebTag[];
  availableStyles: WebStyleProperty[];
  body: WebDocumentNode[];
  tabTitle: string;
  requiredTags: WebTag[];
  visibleText: string[];
  requiredStyles?: WebLevelData['web']['requiredStyles'];
  hint: string;
}

const BASE_TAGS: WebTag[] = ['html', 'head', 'title', 'body', 'h1'];
const TEXT_TAGS: WebTag[] = [...BASE_TAGS, 'h2', 'p', 'strong', 'br'];
const MEDIA_TAGS: WebTag[] = [...TEXT_TAGS, 'img', 'a'];
const STRUCTURE_TAGS: WebTag[] = [...MEDIA_TAGS, 'ul', 'li', 'div', 'section', 'button'];
const BASIC_STYLES: WebStyleProperty[] = ['color', 'background-color', 'font-size', 'text-align'];
const BOX_STYLES: WebStyleProperty[] = [...BASIC_STYLES, 'padding', 'margin', 'border', 'border-radius'];

function node(tag: WebTag, options: Omit<WebDocumentNode, 'tag'> = {}): WebDocumentNode {
  return { tag, ...options };
}

function page(tabTitle: string, body: WebDocumentNode[]): WebDocumentNode[] {
  return [
    node('html', {
      children: [
        node('head', { children: [node('title', { text: tabTitle })] }),
        node('body', { children: body }),
      ],
    }),
  ];
}

function countNodes(nodes: WebDocumentNode[]): number {
  return nodes.reduce((sum, item) => sum + 1 + countNodes(item.children ?? []), 0);
}

function modeOrder(tasks: WebTask[], task: WebTask): number {
  return tasks.slice(0, tasks.indexOf(task) + 1).filter((item) => item.world === task.world && item.mode === task.mode).length;
}

function makeLevel(tasks: WebTask[], task: WebTask): WebLevelData {
  const document = page(task.tabTitle, task.body);
  const htmlCode = `<!doctype html>\n${renderWebDocument(document)}`;
  const commandCount = countNodes(document);
  const order = modeOrder(tasks, task);

  return {
    kind: 'web',
    id: `${task.world}_${task.mode}_${String(order).padStart(3, '0')}`,
    world: task.world,
    mode: task.mode,
    order,
    title: task.title,
    learningOutcome: task.learningOutcome,
    concept: task.concept,
    allowedSyntax: ['html', 'css'],
    starterBlocks: [],
    requiredConcepts: [task.concept],
    maxLoopIterations: 0,
    topicTags: ['web', task.concept],
    childIntro: task.childIntro,
    availableTags: task.availableTags,
    availableStyles: task.availableStyles,
    web: {
      requiredTags: task.requiredTags,
      titleText: task.tabTitle,
      visibleText: task.visibleText,
      requiredStyles: task.requiredStyles,
    },
    starRules: {
      oneStar: { mustComplete: true },
      twoStars: { maxCommands: commandCount + 2 },
      threeStars: { maxCommands: commandCount },
    },
    hints: [task.hint, 'HTML ağacında önce html, sonra head ve body sırasını kur.'],
    solution: {
      logic: task.hint,
      commands: task.requiredTags,
      htmlCode,
      cssCode: '',
      document,
    },
  };
}

const tasks: WebTask[] = [
  {
    world: 'web_html',
    mode: 'easy',
    title: 'Sayfanın İskeleti',
    learningOutcome: 'Çocuk html, head, title ve body sırasını kurar.',
    concept: 'html_structure',
    childIntro: 'Önce sayfanın görünmeyen ve görünen alanlarını ayır.',
    availableTags: BASE_TAGS,
    availableStyles: [],
    tabTitle: 'İlk Sayfam',
    body: [node('h1', { text: 'Merhaba Dünya' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1'],
    visibleText: ['Merhaba Dünya'],
    hint: 'Görünen başlık için h1 bloğunu Body içine koy.',
  },
  {
    world: 'web_html',
    mode: 'medium',
    title: 'Sekme Başlığı Ayrımı',
    learningOutcome: 'Çocuk title ile h1 farkını öğrenir.',
    concept: 'html_structure',
    childIntro: 'Sekme başlığı Head içinde, ekranda görünen başlık Body içinde olmalı.',
    availableTags: BASE_TAGS,
    availableStyles: [],
    tabTitle: 'Narva Web',
    body: [node('h1', { text: 'Ekrandaki Başlık' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1'],
    visibleText: ['Ekrandaki Başlık'],
    hint: 'Title sekmeyi, h1 sayfanın görünen başlığını değiştirir.',
  },
  {
    world: 'web_html',
    mode: 'hard',
    title: 'Boş Sayfayı Tamamla',
    learningOutcome: 'Çocuk eksik iskeleti hata almadan tamamlar.',
    concept: 'html_structure',
    childIntro: 'Eksiksiz sayfa için Head ve Body ikisi de gerekli.',
    availableTags: BASE_TAGS,
    availableStyles: [],
    tabTitle: 'Tam Sayfa',
    body: [node('h1', { text: 'Hazır Sayfa' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1'],
    visibleText: ['Hazır Sayfa'],
    hint: 'Body yoksa ekranda görünen içerik yerleşmez.',
  },
  {
    world: 'web_text',
    mode: 'easy',
    title: 'Paragraf Ekle',
    learningOutcome: 'Çocuk başlık ve paragrafı birlikte kullanır.',
    concept: 'html_text',
    childIntro: 'Başlığın altına kısa bir açıklama yaz.',
    availableTags: TEXT_TAGS,
    availableStyles: [],
    tabTitle: 'Paragraf',
    body: [node('h1', { text: 'Web Günlüğüm' }), node('p', { text: 'Bugün HTML öğrendim.' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'p'],
    visibleText: ['Web Günlüğüm', 'Bugün HTML öğrendim.'],
    hint: 'Paragraf metni Body içinde h1 altına gelir.',
  },
  {
    world: 'web_text',
    mode: 'medium',
    title: 'Alt Başlık Kullan',
    learningOutcome: 'Çocuk h1 ve h2 hiyerarşisini kurar.',
    concept: 'html_text',
    childIntro: 'Sayfada büyük başlık ve alt başlık kullan.',
    availableTags: TEXT_TAGS,
    availableStyles: [],
    tabTitle: 'Başlıklar',
    body: [node('h1', { text: 'Hayvanlar' }), node('h2', { text: 'Kediler' }), node('p', { text: 'Kediler oyun oynamayı sever.' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'h2', 'p'],
    visibleText: ['Hayvanlar', 'Kediler'],
    hint: 'h1 ana başlık, h2 onun altındaki başlıktır.',
  },
  {
    world: 'web_text',
    mode: 'hard',
    title: 'Vurgulu Not',
    learningOutcome: 'Çocuk strong etiketiyle önemli metni ayırır.',
    concept: 'html_text',
    childIntro: 'Paragrafın yanında kısa ve güçlü bir not göster.',
    availableTags: TEXT_TAGS,
    availableStyles: [],
    tabTitle: 'Notlar',
    body: [node('h1', { text: 'Ders Notu' }), node('p', { text: 'HTML içerik yapısını kurar.' }), node('strong', { text: 'Önemli' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'p', 'strong'],
    visibleText: ['Ders Notu', 'Önemli'],
    hint: 'strong bloğu kısa ve önemli metinler içindir.',
  },
  {
    world: 'web_media',
    mode: 'easy',
    title: 'Açıklamalı Görsel',
    learningOutcome: 'Çocuk img ve alt açıklamasını kullanır.',
    concept: 'html_media',
    childIntro: 'Sayfaya erişilebilir bir görsel bloğu ekle.',
    availableTags: MEDIA_TAGS,
    availableStyles: [],
    tabTitle: 'Görsel',
    body: [node('h1', { text: 'Robot Albümü' }), node('img', { attrs: { src: '', alt: 'Robot görseli' } })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'img'],
    visibleText: ['Robot Albümü'],
    hint: 'Görselin alt açıklaması boş kalmamalı.',
  },
  {
    world: 'web_media',
    mode: 'medium',
    title: 'Bağlantı Ver',
    learningOutcome: 'Çocuk link metni ve href alanını ayırt eder.',
    concept: 'html_media',
    childIntro: 'Sayfaya tıklanabilir bir bağlantı ekle.',
    availableTags: MEDIA_TAGS,
    availableStyles: [],
    tabTitle: 'Bağlantı',
    body: [node('h1', { text: 'Kaynaklar' }), node('a', { text: 'Haritaya dön', attrs: { href: '#' } })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'a'],
    visibleText: ['Kaynaklar', 'Haritaya dön'],
    hint: 'Bağlantıda görünen metin ile hedef adres farklı şeylerdir.',
  },
  {
    world: 'web_media',
    mode: 'hard',
    title: 'Tanıtım Kartı İçeriği',
    learningOutcome: 'Çocuk görsel, başlık ve açıklamayı birlikte yerleştirir.',
    concept: 'html_media',
    childIntro: 'Bir karakter için görsel ve açıklama içeren küçük içerik oluştur.',
    availableTags: MEDIA_TAGS,
    availableStyles: [],
    tabTitle: 'Tanıtım',
    body: [node('h1', { text: 'Narva Bot' }), node('img', { attrs: { src: '', alt: 'Narva Bot' } }), node('p', { text: 'Kod yazmayı sever.' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'img', 'p'],
    visibleText: ['Narva Bot', 'Kod yazmayı sever.'],
    hint: 'Tanıtım için başlık, görsel ve paragrafı aynı Body içinde kullan.',
  },
  {
    world: 'web_structure',
    mode: 'easy',
    title: 'Liste Oluştur',
    learningOutcome: 'Çocuk ul ve li ilişkisini kurar.',
    concept: 'html_structure_blocks',
    childIntro: 'Liste bloğunun içine liste maddeleri ekle.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: [],
    tabTitle: 'Liste',
    body: [node('h1', { text: 'Planım' }), node('ul', { children: [node('li', { text: 'Başlık yaz' }), node('li', { text: 'Renk seç' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'ul', 'li'],
    visibleText: ['Planım', 'Başlık yaz'],
    hint: 'li bloğu yalnızca ul bloğunun içine girer.',
  },
  {
    world: 'web_structure',
    mode: 'medium',
    title: 'Bölümle Grupla',
    learningOutcome: 'Çocuk section bloğuyla içerik gruplar.',
    concept: 'html_structure_blocks',
    childIntro: 'Başlık ve paragrafı bir bölüm içinde topla.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: [],
    tabTitle: 'Bölüm',
    body: [node('section', { children: [node('h1', { text: 'Hakkımda' }), node('p', { text: 'Web sayfaları tasarlıyorum.' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'section', 'h1', 'p'],
    visibleText: ['Hakkımda', 'Web sayfaları tasarlıyorum.'],
    hint: 'section benzer içerikleri bir arada tutar.',
  },
  {
    world: 'web_structure',
    mode: 'hard',
    title: 'Kutu İçinde Buton',
    learningOutcome: 'Çocuk div ve button ile basit arayüz parçası kurar.',
    concept: 'html_structure_blocks',
    childIntro: 'Bir kutu içinde başlık ve buton göster.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: [],
    tabTitle: 'Buton',
    body: [node('div', { children: [node('h1', { text: 'Görev Hazır' }), node('button', { text: 'Başla' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'div', 'h1', 'button'],
    visibleText: ['Görev Hazır', 'Başla'],
    hint: 'Buton görünür bir öğedir, Body içindeki bir kutuda durabilir.',
  },
  {
    world: 'web_css',
    mode: 'easy',
    title: 'Başlığı Renklendir',
    learningOutcome: 'Çocuk color özelliğini kullanır.',
    concept: 'css_basics',
    childIntro: 'Başlığa yazı rengi ver.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BASIC_STYLES,
    tabTitle: 'Renk',
    body: [node('h1', { text: 'Mavi Başlık', styles: { color: '#2563eb' } })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1'],
    visibleText: ['Mavi Başlık'],
    requiredStyles: [{ tag: 'h1', property: 'color', value: '#2563eb' }],
    hint: 'Yazı rengi h1 bloğunun stil ayarından gelir.',
  },
  {
    world: 'web_css',
    mode: 'medium',
    title: 'Başlığı Ortala',
    learningOutcome: 'Çocuk text-align ile hizalama yapar.',
    concept: 'css_basics',
    childIntro: 'Başlığı sayfanın ortasına hizala.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BASIC_STYLES,
    tabTitle: 'Hizalama',
    body: [node('h1', { text: 'Ortadaki Başlık', styles: { 'text-align': 'center' } }), node('p', { text: 'Hizalama CSS ile yapılır.' })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1', 'p'],
    visibleText: ['Ortadaki Başlık'],
    requiredStyles: [{ tag: 'h1', property: 'text-align', value: 'center' }],
    hint: 'Ortalamak için text-align değerini center yap.',
  },
  {
    world: 'web_css',
    mode: 'hard',
    title: 'Vurgulu Kahraman Alanı',
    learningOutcome: 'Çocuk renk, arka plan ve yazı boyutunu birlikte kullanır.',
    concept: 'css_basics',
    childIntro: 'Başlığı büyük ve dikkat çekici hale getir.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BASIC_STYLES,
    tabTitle: 'Kahraman',
    body: [node('h1', { text: 'Narva Web', styles: { color: '#166534', 'background-color': '#ecfccb', 'font-size': '32px', 'text-align': 'center' } })],
    requiredTags: ['html', 'head', 'title', 'body', 'h1'],
    visibleText: ['Narva Web'],
    requiredStyles: [
      { tag: 'h1', property: 'background-color', value: '#ecfccb' },
      { tag: 'h1', property: 'font-size', value: '32px' },
    ],
    hint: 'Birden fazla CSS ayarı aynı blokta kullanılabilir.',
  },
  {
    world: 'web_box',
    mode: 'easy',
    title: 'Kart Boşluğu',
    learningOutcome: 'Çocuk padding ile iç boşluk verir.',
    concept: 'css_box_model',
    childIntro: 'Kutu içindeki yazının kenara yapışmaması için boşluk ekle.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BOX_STYLES,
    tabTitle: 'Padding',
    body: [node('div', { styles: { padding: '16px' }, children: [node('p', { text: 'Rahat okunan kart' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'div', 'p'],
    visibleText: ['Rahat okunan kart'],
    requiredStyles: [{ tag: 'div', property: 'padding', value: '16px' }],
    hint: 'Padding kutunun iç boşluğudur.',
  },
  {
    world: 'web_box',
    mode: 'medium',
    title: 'Kenarlıklı Kart',
    learningOutcome: 'Çocuk border ile kart sınırı çizer.',
    concept: 'css_box_model',
    childIntro: 'Kutuya görünür kenarlık ekle.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BOX_STYLES,
    tabTitle: 'Kenarlık',
    body: [node('div', { styles: { padding: '12px', border: '2px solid #38bdf8' }, children: [node('h1', { text: 'Kart' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'div', 'h1'],
    visibleText: ['Kart'],
    requiredStyles: [{ tag: 'div', property: 'border', value: '2px solid #38bdf8' }],
    hint: 'Border kartın dış çizgisidir.',
  },
  {
    world: 'web_box',
    mode: 'hard',
    title: 'Yuvarlak Profil Kartı',
    learningOutcome: 'Çocuk border-radius ile köşe yuvarlar.',
    concept: 'css_box_model',
    childIntro: 'Profil kartına boşluk, kenarlık ve yuvarlak köşe ver.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BOX_STYLES,
    tabTitle: 'Profil',
    body: [node('div', { styles: { padding: '16px', border: '2px solid #84cc16', 'border-radius': '12px' }, children: [node('h1', { text: 'Profil Kartı' }), node('p', { text: 'Ben web öğreniyorum.' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'div', 'h1', 'p'],
    visibleText: ['Profil Kartı'],
    requiredStyles: [
      { tag: 'div', property: 'padding', value: '16px' },
      { tag: 'div', property: 'border-radius', value: '12px' },
    ],
    hint: 'Kart görünümü için padding, border ve border-radius birlikte çalışır.',
  },
  {
    world: 'web_challenge',
    mode: 'easy',
    title: 'Mini Tanıtım Sayfası',
    learningOutcome: 'Çocuk HTML içeriklerini tek sayfada birleştirir.',
    concept: 'web_challenge',
    childIntro: 'Başlık, paragraf ve butonla küçük bir tanıtım sayfası yap.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BOX_STYLES,
    tabTitle: 'Mini Sayfa',
    body: [node('section', { children: [node('h1', { text: 'Kendi Sayfam' }), node('p', { text: 'Bu benim ilk mini web sayfam.' }), node('button', { text: 'Hazırım' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'section', 'h1', 'p', 'button'],
    visibleText: ['Kendi Sayfam', 'Hazırım'],
    hint: 'Mini görevlerde birkaç HTML bloğunu birlikte kullan.',
  },
  {
    world: 'web_challenge',
    mode: 'medium',
    title: 'Renkli Kart Challenge',
    learningOutcome: 'Çocuk HTML ve CSS’i aynı kartta kullanır.',
    concept: 'web_challenge',
    childIntro: 'Kartın hem içeriğini hem görünümünü düzenle.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BOX_STYLES,
    tabTitle: 'Renkli Kart',
    body: [node('div', { styles: { padding: '16px', 'background-color': '#f0f9ff', 'border-radius': '12px' }, children: [node('h1', { text: 'Tasarım Kartı', styles: { color: '#2563eb' } }), node('p', { text: 'CSS kartı güzelleştirir.' })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'div', 'h1', 'p'],
    visibleText: ['Tasarım Kartı'],
    requiredStyles: [
      { tag: 'div', property: 'background-color', value: '#f0f9ff' },
      { tag: 'h1', property: 'color', value: '#2563eb' },
    ],
    hint: 'Kartın dış görünümü div stilinden, başlık rengi h1 stilinden gelir.',
  },
  {
    world: 'web_challenge',
    mode: 'hard',
    title: 'Küçük Portfolyo',
    learningOutcome: 'Çocuk bölüm, liste, bağlantı ve CSS’i birleştirir.',
    concept: 'web_challenge',
    childIntro: 'Kısa portfolyo sayfası kur.',
    availableTags: STRUCTURE_TAGS,
    availableStyles: BOX_STYLES,
    tabTitle: 'Portfolyo',
    body: [node('section', { styles: { padding: '16px', border: '2px solid #38bdf8', 'border-radius': '12px' }, children: [node('h1', { text: 'Benim Portfolyom', styles: { 'text-align': 'center' } }), node('ul', { children: [node('li', { text: 'HTML' }), node('li', { text: 'CSS' })] }), node('a', { text: 'İletişim', attrs: { href: '#' } })] })],
    requiredTags: ['html', 'head', 'title', 'body', 'section', 'h1', 'ul', 'li', 'a'],
    visibleText: ['Benim Portfolyom', 'İletişim'],
    requiredStyles: [
      { tag: 'section', property: 'border-radius', value: '12px' },
      { tag: 'h1', property: 'text-align', value: 'center' },
    ],
    hint: 'Portfolyo görevi HTML yapı ve CSS görünümü birlikte ister.',
  },
];

export const webLevels: WebLevelData[] = tasks.map((task) => makeLevel(tasks, task));
