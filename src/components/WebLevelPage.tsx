'use client';

import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import ResultPanel from '@/components/ResultPanel';
import FeedbackPopup from '@/components/FeedbackPopup';
import { Button } from '@/components/ui/Button';
import type { WebDocumentNode, WebLevelData, WebStyleProperty, WebTag } from '@/modules/levels/schema';
import { WORLD_META, getNextLevelId, levelRegistry, type WorldId } from '@/modules/levels/registry';
import {
  canContain,
  countWebNodes,
  createWebNode,
  parseWebDocument,
  renderWebDocument,
  renderWebPreview,
  styleLabel,
  tagLabel,
  validateWebLevel,
} from '@/modules/web/engine';
import { type LevelId, useProgress } from '@/store/progress';

interface WebLevelPageProps {
  level: WebLevelData;
}

type WebEditorMode = 'blocks' | 'code';

const WEB_TAG_COLORS: Record<WebTag, string> = {
  html: '#22c55e',
  head: '#14b8a6',
  title: '#0ea5e9',
  body: '#8b5cf6',
  h1: '#f97316',
  h2: '#fb7185',
  p: '#38bdf8',
  strong: '#f59e0b',
  br: '#94a3b8',
  img: '#06b6d4',
  a: '#2563eb',
  ul: '#84cc16',
  li: '#a3e635',
  div: '#ec4899',
  section: '#d946ef',
  button: '#ef4444',
};

const STYLE_VALUES: Record<WebStyleProperty, string[]> = {
  color: ['#2563eb', '#e11d48', '#166534', '#7c3aed'],
  'background-color': ['#f0f9ff', '#ecfccb', '#fff7ed', '#fef3c7'],
  'font-size': ['20px', '24px', '28px', '32px'],
  'text-align': ['left', 'center', 'right'],
  padding: ['8px', '12px', '16px', '20px'],
  margin: ['8px', '12px', '16px', '20px'],
  border: ['2px solid #38bdf8', '2px solid #84cc16', '2px solid #f97316'],
  'border-radius': ['6px', '8px', '12px', '16px'],
};

export default function WebLevelPage({ level }: WebLevelPageProps) {
  const router = useRouter();
  const setCurrentLevel = useProgress((state) => state.setCurrentLevel);
  const [nodes, setNodes] = useState<WebDocumentNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [stars, setStars] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalStars, setFinalStars] = useState(0);
  const [finalCommandCount, setFinalCommandCount] = useState(0);
  const [editorMode, setEditorMode] = useState<WebEditorMode>('blocks');
  const [codeInput, setCodeInput] = useState('');

  const blockHtmlCode = useMemo(() => `<!doctype html>\n${renderWebDocument(nodes)}`, [nodes]);
  const parsedCode = useMemo(() => parseWebDocument(codeInput), [codeInput]);
  const activeNodes = editorMode === 'code' ? parsedCode.nodes : nodes;
  const activeNodeCount = countWebNodes(activeNodes);
  const htmlCode = editorMode === 'code' ? codeInput : blockHtmlCode;
  const previewCode = renderWebPreview(activeNodes);
  const previewTitle = useMemo(() => findTitleText(activeNodes) || level.web.titleText || 'Başlıksız Sayfa', [activeNodes, level.web.titleText]);
  const currentLevelNumber = levelRegistry.findIndex((entry) => entry.id === level.id) + 1;
  const selectedNode = selectedNodeId ? findNode(nodes, selectedNodeId) : null;

  useEffect(() => {
    setCurrentLevel(level.id as LevelId);
    setNodes([]);
    setSelectedNodeId(null);
    setMessage('');
    setStars(0);
    setShowResult(false);
    setFinalStars(0);
    setFinalCommandCount(0);
    setEditorMode('blocks');
    setCodeInput('');
  }, [level, setCurrentLevel]);

  const addTag = (tag: WebTag, parentId?: string | null) => {
    const targetParentId = parentId === undefined ? resolveDefaultParentId(nodes, selectedNodeId, tag) : parentId;
    const parent = targetParentId ? findNode(nodes, targetParentId) : null;
    const parentTag = parent?.tag ?? null;

    if (!canContain(parentTag, tag)) {
      setMessage(webPlacementMessage(parentTag, tag));
      return;
    }
    if (tag === 'html' && nodes.some((node) => node.tag === 'html')) {
      setMessage('Sayfada zaten bir HTML bloğu var.');
      return;
    }
    if (!level.availableTags.includes(tag)) {
      setMessage(`${tagLabel(tag)} bloğu bu seviyede kullanılamaz.`);
      return;
    }

    const nextNode = createWebNode(tag);
    setNodes((current) => insertNode(current, targetParentId ?? null, nextNode));
    setSelectedNodeId(nextNode.id ?? null);
    setMessage('');
  };

  const runWebLevel = () => {
    if (editorMode === 'code' && parsedCode.errors.length > 0) {
      setMessage(parsedCode.errors[0] || 'HTML kodunda düzeltilmesi gereken bir yer var.');
      return;
    }

    const result = validateWebLevel(level, activeNodes);
    if (!result.completed) {
      setMessage(result.errors[0] || 'Sayfanda küçük bir eksik var.');
      return;
    }

    const earned = calculateStars(level, result.commandCount);
    useProgress.getState().recordCompletion(level.id as LevelId, result.commandCount, earned);
    setStars(earned);
    setFinalStars(earned);
    setFinalCommandCount(result.commandCount);
    setShowResult(true);
    setMessage('Sayfa doğru çalıştı. Önizlemede sonucu görebilirsin.');
  };

  const resetLevel = () => {
    setNodes([]);
    setSelectedNodeId(null);
    setMessage('');
    setStars(0);
    setShowResult(false);
    setFinalStars(0);
    setFinalCommandCount(0);
    setEditorMode('blocks');
    setCodeInput('');
  };

  const handleNext = () => {
    const next = getNextLevelId(level.id);
    router.push(next ? `/level/${next}` : '/world-map');
  };

  const onPaletteDragStart = (event: DragEvent<HTMLButtonElement>, tag: WebTag) => {
    event.dataTransfer.setData('application/x-web-tag', tag);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const onDropTag = (event: DragEvent<HTMLElement>, parentId?: string | null) => {
    event.preventDefault();
    const tag = event.dataTransfer.getData('application/x-web-tag') as WebTag;
    if (tag) addTag(tag, parentId);
  };

  const updateSelectedNode = (patch: Partial<WebDocumentNode>) => {
    if (!selectedNodeId) return;
    setNodes((current) => updateNode(current, selectedNodeId, patch));
  };

  const updateSelectedStyle = (property: WebStyleProperty, value: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateSelectedNode({
      styles: {
        ...(selectedNode.styles ?? {}),
        [property]: value,
      },
    });
  };

  const switchEditorMode = (mode: WebEditorMode) => {
    if (mode === editorMode) return;

    if (mode === 'code') {
      setCodeInput(blockHtmlCode);
      setEditorMode('code');
      setSelectedNodeId(null);
      setMessage('Kod Modu acildi. HTML kodunu elle duzenleyebilirsin.');
      return;
    }

    const parsed = parseWebDocument(codeInput);
    if (codeInput.trim() && parsed.errors.length > 0) {
      setMessage(parsed.errors[0] || 'Blok Moduna donmeden once HTML kodunu duzelt.');
      return;
    }

    if (codeInput.trim()) setNodes(parsed.nodes);
    setEditorMode('blocks');
    setSelectedNodeId(null);
    setMessage('Blok Modu acildi. Gecerli HTML kodu blok agacina aktarildi.');
  };

  return (
    <main className="level-page web-level-page">
      <div className="level-layout web-level-layout">
        <aside className="block-editor web-editor-card" aria-label="Web blok editoru">
          <h2>{editorMode === 'code' ? 'WEB Kod Editörü' : 'WEB Blok Editörü'}</h2>
          <div className="editor-mode-tabs" aria-label="Web editor modu">
            <button
              type="button"
              className={editorMode === 'code' ? 'active' : ''}
              aria-pressed={editorMode === 'code'}
              onClick={() => switchEditorMode('code')}
            >
              Kod Modu
            </button>
            <button
              type="button"
              className={editorMode === 'blocks' ? 'active' : ''}
              aria-pressed={editorMode === 'blocks'}
              onClick={() => switchEditorMode('blocks')}
            >
              Blok Modu
            </button>
          </div>

          {editorMode === 'blocks' && (
            <>
              <div className="web-editor-grid">
                <section className="web-palette" aria-label="Kullanılacak web blokları">
                  <span>Kullanılacak Bloklar</span>
                  {level.availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      draggable
                      onDragStart={(event) => onPaletteDragStart(event, tag)}
                      onClick={() => addTag(tag)}
                      style={{ '--web-block-color': WEB_TAG_COLORS[tag] } as CSSProperties}
                    >
                      <strong>{`<${tag}>`}</strong>
                      <small>{tagLabel(tag)}</small>
                    </button>
                  ))}
                </section>

                <section
                  className="web-tree-workspace"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDropTag(event, null)}
                  aria-label="HTML çalışma alanı"
                >
                  <div className="web-workspace-header">
                    <strong>HTML Ağacı</strong>
                    <button type="button" onClick={resetLevel}>Temizle</button>
                  </div>
                  {nodes.length ? (
                    <div className="web-node-list">
                      {nodes.map((node) => renderWebNode(node, selectedNodeId, setSelectedNodeId, onDropTag, removeNodeFromWorkspace))}
                    </div>
                  ) : (
                    <p className="web-empty-drop">HTML bloğunu buraya sürükle.</p>
                  )}
                </section>
              </div>

              <section className="web-inspector" aria-label="Seçili blok ayarları">
                <div className="web-panel-heading">
                  <div>
                    <span>Seçili Blok</span>
                    <h3>Blok Ayarları</h3>
                  </div>
                  {selectedNode && (
                    <strong
                      className="web-selected-tag"
                      style={{ '--web-block-color': WEB_TAG_COLORS[selectedNode.tag] } as CSSProperties}
                    >
                      {`<${selectedNode.tag}>`}
                    </strong>
                  )}
                </div>
                {selectedNode ? (
                  <>
                    <p className="web-inspector-summary">{tagLabel(selectedNode.tag)} bloğunu düzenliyorsun.</p>
                    {hasText(selectedNode.tag) && (
                      <label>
                        Yazı
                        <input
                          value={selectedNode.text ?? ''}
                          onChange={(event) => updateSelectedNode({ text: event.target.value })}
                        />
                      </label>
                    )}
                    {selectedNode.tag === 'img' && (
                      <label>
                        Alt açıklama
                        <input
                          value={selectedNode.attrs?.alt ?? ''}
                          onChange={(event) => updateSelectedNode({ attrs: { ...(selectedNode.attrs ?? {}), alt: event.target.value } })}
                        />
                      </label>
                    )}
                    {selectedNode.tag === 'a' && (
                      <label>
                        Bağlantı
                        <input
                          value={selectedNode.attrs?.href ?? '#'}
                          onChange={(event) => updateSelectedNode({ attrs: { ...(selectedNode.attrs ?? {}), href: event.target.value } })}
                        />
                      </label>
                    )}
                    {level.availableStyles.length > 0 && (
                      <div className="web-style-controls">
                        {level.availableStyles.map((property) => (
                          <label key={property}>
                            {styleLabel(property)}
                            <select
                              value={selectedNode.styles?.[property] ?? ''}
                              onChange={(event) => updateSelectedStyle(property, event.target.value)}
                            >
                              <option value="">seç</option>
                              {STYLE_VALUES[property].map((value) => (
                                <option key={value} value={value}>{value}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="web-inspector-empty">Bir blok seçince yazı, bağlantı ve CSS ayarları burada görünür.</p>
                )}
              </section>
            </>
          )}

          <section className="web-code-panel" aria-label="Üretilen HTML kodu">
            <div className="web-panel-heading">
              <div>
                <span>{editorMode === 'code' ? 'Kod Modu' : 'Kod Çıktısı'}</span>
                <h3>{editorMode === 'code' ? 'HTML Kodunu Yaz' : 'Üretilen HTML'}</h3>
              </div>
              <strong>{activeNodeCount} blok</strong>
            </div>
            <textarea
              id="web-code"
              value={htmlCode}
              readOnly={editorMode === 'blocks'}
              onChange={(event) => {
                setCodeInput(event.target.value);
                setShowResult(false);
                setMessage('');
              }}
              rows={editorMode === 'code' ? 18 : 10}
              spellCheck={false}
              placeholder={'<!doctype html>\n<html>\n  <head>\n    <title>İlk Sayfam</title>\n  </head>\n  <body>\n    <h1>Merhaba Dünya</h1>\n  </body>\n</html>'}
            />
          </section>

          <section className="control-panel" aria-label="Web kontrolleri">
            <div className="control-panel-header">
              <span>Kod Kontrolleri</span>
              <strong>{activeNodeCount} blok</strong>
            </div>
            <div className="control-primary-row">
              <Button className="control-button control-run" onClick={runWebLevel}>
                <span aria-hidden="true">▶</span>
                Çalıştır
              </Button>
              <Button className="control-button control-step" onClick={() => setMessage(level.hints[0])}>
                <span aria-hidden="true">?</span>
                İpucu
              </Button>
            </div>
            <div className="control-secondary-row">
              <Button className="control-button control-reset" onClick={resetLevel}>Reset</Button>
              <Button className="control-button control-map" onClick={() => router.push('/world-map')}>Harita</Button>
            </div>
          </section>
        </aside>

        <div className="level-content">
          <section className="task-card web-task-card" aria-label="Web görev kartı">
            <div className="task-card-main">
              <div className="task-card-topline">
                <span className="level-world">{WORLD_META[level.world as WorldId]?.title || 'WEB Dünyası'}</span>
                <div className="level-stars" aria-label={`${stars} yıldız`}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <span key={index} className={index < stars ? 'earned' : ''}>*</span>
                  ))}
                </div>
              </div>
              <h1>{level.title}</h1>
              <h2>{level.learningOutcome}</h2>
              <div className="curriculum-status" aria-label="Müfredat durumu">
                <span>Seviye {currentLevelNumber} / {levelRegistry.length}</span>
                <strong>HTML / CSS</strong>
              </div>
            </div>
            <div className="task-facts" aria-label="Web görev bilgileri">
              <div className="task-fact">
                <span>Sayfa Kökü</span>
                <strong>html</strong>
              </div>
              <div className="task-fact">
                <span>Görünür Alan</span>
                <strong>body</strong>
              </div>
              <div className="task-fact">
                <span>Beklenen</span>
                <strong>{level.web.requiredTags.map((tag) => `<${tag}>`).join(' ')}</strong>
              </div>
            </div>
            <p className="task-hint">İpucu: {level.hints[0]}</p>
          </section>

          <section className="web-preview-panel" aria-label="Canlı web önizleme">
            <div className="web-preview-toolbar">
              <span>Canlı Tarayıcı Önizlemesi</span>
              <strong>Sekme: {previewTitle}</strong>
            </div>
            <iframe title="Web önizleme" sandbox="" srcDoc={previewCode} />
          </section>
        </div>
      </div>

      {showResult && (
        <ResultPanel
          stars={finalStars}
          commandCount={finalCommandCount}
          bestCommandCount={level.starRules.threeStars.maxCommands}
          feedback="HTML ağacını doğru kurdun. Sonraki görevde görünümü CSS ile güçlendireceksin."
          onRetry={resetLevel}
          onNext={handleNext}
        />
      )}
      {isWebErrorMessage(message) && <FeedbackPopup message={message} onClose={() => setMessage('')} />}
    </main>
  );

  function removeNodeFromWorkspace(id: string) {
    setNodes((current) => removeNode(current, id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  }
}

function isWebErrorMessage(message: string): boolean {
  if (!message) return false;
  return [
    'HTML',
    'Sayfada',
    'Sekme',
    'Blok',
    'Görünen',
    'Liste',
    'Body',
    'Head',
    'Çalışma',
    'Önce',
  ].some((prefix) => message.startsWith(prefix)) || message.includes('kullanılamaz') || message.includes('eksik') || message.includes('olmalı');
}

function renderWebNode(
  node: WebDocumentNode,
  selectedNodeId: string | null,
  setSelectedNodeId: (id: string) => void,
  onDropTag: (event: DragEvent<HTMLElement>, parentId?: string | null) => void,
  onRemove: (id: string) => void,
): ReactElement {
  const nodeId = node.id || `${node.tag}-fallback`;
  const children = node.children ?? [];
  return (
    <article
      key={nodeId}
      className={`web-node ${selectedNodeId === nodeId ? 'selected' : ''}`}
      style={{ '--web-block-color': WEB_TAG_COLORS[node.tag] } as CSSProperties}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedNodeId(nodeId);
      }}
    >
      <header>
        <span>{`<${node.tag}>`}</span>
        <strong>{tagLabel(node.tag)}</strong>
        <button type="button" onClick={(event) => {
          event.stopPropagation();
          onRemove(nodeId);
        }}>
          Sil
        </button>
      </header>
      {hasText(node.tag) && node.text && <p>{node.text}</p>}
      {canHaveChildren(node.tag) && (
        <div
          className="web-child-drop"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDropTag(event, nodeId)}
        >
          {children.length ? (
            children.map((child) => renderWebNode(child, selectedNodeId, setSelectedNodeId, onDropTag, onRemove))
          ) : (
            <span>İç blokları buraya sürükle.</span>
          )}
        </div>
      )}
    </article>
  );
}

function calculateStars(level: WebLevelData, commandCount: number): number {
  if (commandCount <= level.starRules.threeStars.maxCommands) return 3;
  if (commandCount <= level.starRules.twoStars.maxCommands) return 2;
  return 1;
}

function webPlacementMessage(parentTag: WebTag | null, childTag: WebTag): string {
  if (!parentTag) return 'Çalışma alanına önce HTML bloğunu ekle.';
  if (childTag === 'title') return 'Sekme Başlığı yalnızca Head bloğunun içine girer.';
  if (['h1', 'h2', 'p', 'img', 'a', 'button'].includes(childTag)) return `${tagLabel(childTag)} görünür bir bloktur; Body içine ekle.`;
  if (childTag === 'li') return 'Liste maddesi yalnızca Liste bloğunun içine girer.';
  return `${tagLabel(childTag)} bloğu ${tagLabel(parentTag)} içine eklenemez.`;
}

function resolveDefaultParentId(nodes: WebDocumentNode[], selectedNodeId: string | null, tag: WebTag): string | null {
  const selected = selectedNodeId ? findNode(nodes, selectedNodeId) : null;
  if (selected?.tag && canContain(selected.tag, tag)) return selectedNodeId;
  if (tag === 'html') return null;

  const flat = flattenNodes(nodes);
  if (tag === 'head' || tag === 'body') return flat.find((node) => node.tag === 'html')?.id ?? null;
  if (tag === 'title') return flat.find((node) => node.tag === 'head')?.id ?? null;
  if (tag === 'li') return flat.find((node) => node.tag === 'ul')?.id ?? null;
  return flat.find((node) => node.tag === 'body')?.id ?? null;
}

function hasText(tag: WebTag): boolean {
  return ['title', 'h1', 'h2', 'p', 'strong', 'a', 'button', 'li'].includes(tag);
}

function canHaveChildren(tag: WebTag): boolean {
  return ['html', 'head', 'body', 'ul', 'div', 'section'].includes(tag);
}

function findNode(nodes: WebDocumentNode[], id: string): WebDocumentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function findTitleText(nodes: WebDocumentNode[]): string | null {
  for (const node of nodes) {
    if (node.tag === 'title') return node.text?.trim() || null;
    const found = findTitleText(node.children ?? []);
    if (found) return found;
  }
  return null;
}

function insertNode(nodes: WebDocumentNode[], parentId: string | null, nextNode: WebDocumentNode): WebDocumentNode[] {
  if (!parentId) return [...nodes, nextNode];
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), nextNode] };
    }
    return { ...node, children: insertNode(node.children ?? [], parentId, nextNode) };
  });
}

function updateNode(nodes: WebDocumentNode[], id: string, patch: Partial<WebDocumentNode>): WebDocumentNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...patch };
    return { ...node, children: updateNode(node.children ?? [], id, patch) };
  });
}

function removeNode(nodes: WebDocumentNode[], id: string): WebDocumentNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: removeNode(node.children ?? [], id) }));
}

function flattenNodes(nodes: WebDocumentNode[]): WebDocumentNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])]);
}
