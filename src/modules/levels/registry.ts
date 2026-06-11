import type { LevelData, LevelMode } from './schema';
import { webLevels } from './webLevels';
import level0 from '../../../data/levels/movement/easy/movement_easy_001.json';
import level1 from '../../../data/levels/movement/easy/movement_easy_002.json';
import level2 from '../../../data/levels/movement/easy/movement_easy_003.json';
import level3 from '../../../data/levels/movement/easy/movement_easy_004.json';
import level4 from '../../../data/levels/movement/easy/movement_easy_005.json';
import level5 from '../../../data/levels/movement/easy/movement_easy_006.json';
import level6 from '../../../data/levels/movement/easy/movement_easy_007.json';
import level7 from '../../../data/levels/movement/easy/movement_easy_008.json';
import level8 from '../../../data/levels/movement/medium/movement_medium_001.json';
import level9 from '../../../data/levels/movement/medium/movement_medium_002.json';
import level10 from '../../../data/levels/sequence/easy/sequence_easy_001.json';
import level11 from '../../../data/levels/sequence/easy/sequence_easy_002.json';
import level12 from '../../../data/levels/sequence/easy/sequence_easy_003.json';
import level13 from '../../../data/levels/sequence/easy/sequence_easy_004.json';
import level14 from '../../../data/levels/sequence/easy/sequence_easy_005.json';
import level15 from '../../../data/levels/sequence/easy/sequence_easy_006.json';
import level16 from '../../../data/levels/sequence/easy/sequence_easy_007.json';
import level17 from '../../../data/levels/sequence/easy/sequence_easy_008.json';
import level18 from '../../../data/levels/sequence/medium/sequence_medium_001.json';
import level19 from '../../../data/levels/sequence/medium/sequence_medium_002.json';
import level20 from '../../../data/levels/sequence/medium/sequence_medium_003.json';
import level21 from '../../../data/levels/sequence/medium/sequence_medium_004.json';
import level22 from '../../../data/levels/sequence/medium/sequence_medium_005.json';
import level23 from '../../../data/levels/sequence/medium/sequence_medium_006.json';
import level24 from '../../../data/levels/sequence/medium/sequence_medium_007.json';
import level25 from '../../../data/levels/sequence/medium/sequence_medium_008.json';
import level26 from '../../../data/levels/sequence/hard/sequence_hard_001.json';
import level27 from '../../../data/levels/sequence/hard/sequence_hard_002.json';
import level28 from '../../../data/levels/sequence/hard/sequence_hard_003.json';
import level29 from '../../../data/levels/sequence/hard/sequence_hard_004.json';
import level30 from '../../../data/levels/sequence/hard/sequence_hard_005.json';
import level31 from '../../../data/levels/sequence/hard/sequence_hard_006.json';
import level32 from '../../../data/levels/sequence/hard/sequence_hard_007.json';
import level33 from '../../../data/levels/sequence/hard/sequence_hard_008.json';
import level34 from '../../../data/levels/conditions/easy/conditions_easy_001.json';
import level35 from '../../../data/levels/conditions/easy/conditions_easy_002.json';
import level36 from '../../../data/levels/conditions/easy/conditions_easy_003.json';
import level37 from '../../../data/levels/conditions/easy/conditions_easy_004.json';
import level38 from '../../../data/levels/conditions/easy/conditions_easy_005.json';
import level39 from '../../../data/levels/conditions/easy/conditions_easy_006.json';
import level40 from '../../../data/levels/conditions/easy/conditions_easy_007.json';
import level41 from '../../../data/levels/conditions/easy/conditions_easy_008.json';
import level42 from '../../../data/levels/conditions/easy/conditions_easy_009.json';
import level43 from '../../../data/levels/conditions/easy/conditions_easy_010.json';
import level44 from '../../../data/levels/conditions/medium/conditions_medium_001.json';
import level45 from '../../../data/levels/conditions/medium/conditions_medium_002.json';
import level46 from '../../../data/levels/conditions/medium/conditions_medium_003.json';
import level47 from '../../../data/levels/conditions/medium/conditions_medium_004.json';
import level48 from '../../../data/levels/conditions/medium/conditions_medium_005.json';
import level49 from '../../../data/levels/conditions/medium/conditions_medium_006.json';
import level50 from '../../../data/levels/conditions/medium/conditions_medium_007.json';
import level51 from '../../../data/levels/conditions/medium/conditions_medium_008.json';
import level52 from '../../../data/levels/conditions/hard/conditions_hard_001.json';
import level53 from '../../../data/levels/conditions/hard/conditions_hard_002.json';
import level54 from '../../../data/levels/conditions/hard/conditions_hard_003.json';
import level55 from '../../../data/levels/conditions/hard/conditions_hard_004.json';
import level56 from '../../../data/levels/conditions/hard/conditions_hard_005.json';
import level57 from '../../../data/levels/conditions/hard/conditions_hard_006.json';
import level58 from '../../../data/levels/conditions/hard/conditions_hard_007.json';
import level59 from '../../../data/levels/conditions/hard/conditions_hard_008.json';
import level60 from '../../../data/levels/loops/easy/loops_easy_001.json';
import level61 from '../../../data/levels/loops/easy/loops_easy_002.json';
import level62 from '../../../data/levels/loops/easy/loops_easy_003.json';
import level63 from '../../../data/levels/loops/easy/loops_easy_004.json';
import level64 from '../../../data/levels/loops/easy/loops_easy_005.json';
import level65 from '../../../data/levels/loops/easy/loops_easy_006.json';
import level66 from '../../../data/levels/loops/easy/loops_easy_007.json';
import level67 from '../../../data/levels/loops/easy/loops_easy_008.json';
import level68 from '../../../data/levels/loops/easy/loops_easy_009.json';
import level69 from '../../../data/levels/loops/easy/loops_easy_010.json';
import level70 from '../../../data/levels/loops/easy/loops_easy_011.json';
import level71 from '../../../data/levels/loops/easy/loops_easy_012.json';
import level72 from '../../../data/levels/loops/easy/loops_easy_013.json';
import level73 from '../../../data/levels/loops/easy/loops_easy_014.json';
import level74 from '../../../data/levels/loops/medium/loops_medium_001.json';
import level75 from '../../../data/levels/loops/medium/loops_medium_002.json';
import level76 from '../../../data/levels/loops/medium/loops_medium_003.json';
import level77 from '../../../data/levels/loops/medium/loops_medium_004.json';
import level78 from '../../../data/levels/loops/medium/loops_medium_005.json';
import level79 from '../../../data/levels/loops/medium/loops_medium_006.json';
import level80 from '../../../data/levels/loops/medium/loops_medium_007.json';
import level81 from '../../../data/levels/loops/medium/loops_medium_008.json';
import level82 from '../../../data/levels/loops/medium/loops_medium_009.json';
import level83 from '../../../data/levels/loops/medium/loops_medium_010.json';
import level84 from '../../../data/levels/loops/medium/loops_medium_011.json';
import level85 from '../../../data/levels/loops/medium/loops_medium_012.json';
import level86 from '../../../data/levels/loops/medium/loops_medium_013.json';
import level87 from '../../../data/levels/loops/hard/loops_hard_001.json';
import level88 from '../../../data/levels/loops/hard/loops_hard_002.json';
import level89 from '../../../data/levels/loops/hard/loops_hard_003.json';
import level90 from '../../../data/levels/loops/hard/loops_hard_004.json';
import level91 from '../../../data/levels/loops/hard/loops_hard_005.json';
import level92 from '../../../data/levels/loops/hard/loops_hard_006.json';
import level93 from '../../../data/levels/loops/hard/loops_hard_007.json';
import level94 from '../../../data/levels/loops/hard/loops_hard_008.json';
import level95 from '../../../data/levels/loops/hard/loops_hard_009.json';
import level96 from '../../../data/levels/loops/hard/loops_hard_010.json';
import level97 from '../../../data/levels/loops/hard/loops_hard_011.json';
import level98 from '../../../data/levels/loops/hard/loops_hard_012.json';
import level99 from '../../../data/levels/loops/hard/loops_hard_013.json';
import level100 from '../../../data/levels/matchcase/easy/matchcase_easy_001.json';
import level101 from '../../../data/levels/matchcase/easy/matchcase_easy_002.json';
import level102 from '../../../data/levels/matchcase/easy/matchcase_easy_003.json';
import level103 from '../../../data/levels/matchcase/easy/matchcase_easy_004.json';
import level104 from '../../../data/levels/matchcase/easy/matchcase_easy_005.json';
import level105 from '../../../data/levels/matchcase/easy/matchcase_easy_006.json';
import level106 from '../../../data/levels/matchcase/medium/matchcase_medium_001.json';
import level107 from '../../../data/levels/matchcase/medium/matchcase_medium_002.json';
import level108 from '../../../data/levels/matchcase/medium/matchcase_medium_003.json';
import level109 from '../../../data/levels/matchcase/medium/matchcase_medium_004.json';
import level110 from '../../../data/levels/matchcase/medium/matchcase_medium_005.json';
import level111 from '../../../data/levels/matchcase/medium/matchcase_medium_006.json';
import level112 from '../../../data/levels/matchcase/hard/matchcase_hard_001.json';
import level113 from '../../../data/levels/matchcase/hard/matchcase_hard_002.json';
import level114 from '../../../data/levels/matchcase/hard/matchcase_hard_003.json';
import level115 from '../../../data/levels/matchcase/hard/matchcase_hard_004.json';
import level116 from '../../../data/levels/matchcase/hard/matchcase_hard_005.json';
import level117 from '../../../data/levels/matchcase/hard/matchcase_hard_006.json';
import level118 from '../../../data/levels/challenge/easy/challenge_easy_001.json';
import level119 from '../../../data/levels/challenge/medium/challenge_medium_001.json';

export type TrackId = 'python' | 'web';
export type WorldId =
  | 'movement'
  | 'sequence'
  | 'conditions'
  | 'loops'
  | 'matchcase'
  | 'challenge'
  | 'web_html'
  | 'web_text'
  | 'web_media'
  | 'web_structure'
  | 'web_css'
  | 'web_box'
  | 'web_challenge';
export type LevelId = string;

export interface WorldMeta {
  id: WorldId;
  track: TrackId;
  title: string;
  description: string;
  order: number;
}

export interface LevelRegistryEntry {
  id: LevelId;
  track: TrackId;
  world: WorldId;
  mode: LevelMode;
  order: number;
  title: string;
  levelData: LevelData;
}

export const PYTHON_WORLD_ORDER: WorldId[] = ["movement","sequence","conditions","loops","matchcase","challenge"];
export const WEB_WORLD_ORDER: WorldId[] = ["web_html","web_text","web_media","web_structure","web_css","web_box","web_challenge"];
export const WORLD_ORDER: WorldId[] = [...PYTHON_WORLD_ORDER, ...WEB_WORLD_ORDER];
export const MODE_ORDER: LevelMode[] = ["easy","medium","hard"];

export const WORLD_META: Record<WorldId, WorldMeta> = {
  movement: { id: 'movement', track: 'python', title: 'Hareket ve Kod Girisi', description: 'Komut, satir sirasi ve parametreli hareketleri ogrenir.', order: 1 },
  sequence: { id: 'sequence', track: 'python', title: 'Degiskenler ve Operatorler', description: 'Degiskenleri, aritmetik ifadeleri ve karsilastirmalari kullanir.', order: 2 },
  conditions: { id: 'conditions', track: 'python', title: 'If Else Kararlari', description: 'If else ile karar vermeyi ogrenir.', order: 3 },
  loops: { id: 'loops', track: 'python', title: 'While ve For Donguleri', description: 'While ve for range ile tekrar eden kodlari yazar.', order: 4 },
  matchcase: { id: 'matchcase', track: 'python', title: 'Match Case Secimleri', description: 'Match case ile secime gore rota kurar.', order: 5 },
  challenge: { id: 'challenge', track: 'python', title: 'Mini Python Gorevleri', description: 'Birden fazla Python fikrini ayni gorevde birlestirir.', order: 6 },
  web_html: { id: 'web_html', track: 'web', title: 'HTML Iskeleti', description: 'Html, head, title, body ve gorunen basligi dogru sirada kurar.', order: 1 },
  web_text: { id: 'web_text', track: 'web', title: 'Metin Bloklari', description: 'Baslik, paragraf ve vurgu etiketleriyle okunabilir sayfa kurar.', order: 2 },
  web_media: { id: 'web_media', track: 'web', title: 'Gorsel ve Baglanti', description: 'Gorsel aciklamasi ve baglanti etiketlerini kullanir.', order: 3 },
  web_structure: { id: 'web_structure', track: 'web', title: 'Sayfa Bolumleri', description: 'Liste, kutu ve bolumlerle icerigi duzenler.', order: 4 },
  web_css: { id: 'web_css', track: 'web', title: 'CSS Temelleri', description: 'Renk, yazi boyutu ve hizalama ayarlarini kullanir.', order: 5 },
  web_box: { id: 'web_box', track: 'web', title: 'Kutu Modeli', description: 'Padding, border ve kose ayarlariyla kart tasarlar.', order: 6 },
  web_challenge: { id: 'web_challenge', track: 'web', title: 'Mini Web Gorevleri', description: 'HTML ve CSS fikirlerini tek sayfada birlestirir.', order: 7 },
};

const LEVEL_DATA: LevelData[] = [
  level0 as LevelData,
  level1 as LevelData,
  level2 as LevelData,
  level3 as LevelData,
  level4 as LevelData,
  level5 as LevelData,
  level6 as LevelData,
  level7 as LevelData,
  level8 as LevelData,
  level9 as LevelData,
  level10 as LevelData,
  level11 as LevelData,
  level12 as LevelData,
  level13 as LevelData,
  level14 as LevelData,
  level15 as LevelData,
  level16 as LevelData,
  level17 as LevelData,
  level18 as LevelData,
  level19 as LevelData,
  level20 as LevelData,
  level21 as LevelData,
  level22 as LevelData,
  level23 as LevelData,
  level24 as LevelData,
  level25 as LevelData,
  level26 as LevelData,
  level27 as LevelData,
  level28 as LevelData,
  level29 as LevelData,
  level30 as LevelData,
  level31 as LevelData,
  level32 as LevelData,
  level33 as LevelData,
  level34 as LevelData,
  level35 as LevelData,
  level36 as LevelData,
  level37 as LevelData,
  level38 as LevelData,
  level39 as LevelData,
  level40 as LevelData,
  level41 as LevelData,
  level42 as LevelData,
  level43 as LevelData,
  level44 as LevelData,
  level45 as LevelData,
  level46 as LevelData,
  level47 as LevelData,
  level48 as LevelData,
  level49 as LevelData,
  level50 as LevelData,
  level51 as LevelData,
  level52 as LevelData,
  level53 as LevelData,
  level54 as LevelData,
  level55 as LevelData,
  level56 as LevelData,
  level57 as LevelData,
  level58 as LevelData,
  level59 as LevelData,
  level60 as LevelData,
  level61 as LevelData,
  level62 as LevelData,
  level63 as LevelData,
  level64 as LevelData,
  level65 as LevelData,
  level66 as LevelData,
  level67 as LevelData,
  level68 as LevelData,
  level69 as LevelData,
  level70 as LevelData,
  level71 as LevelData,
  level72 as LevelData,
  level73 as LevelData,
  level74 as LevelData,
  level75 as LevelData,
  level76 as LevelData,
  level77 as LevelData,
  level78 as LevelData,
  level79 as LevelData,
  level80 as LevelData,
  level81 as LevelData,
  level82 as LevelData,
  level83 as LevelData,
  level84 as LevelData,
  level85 as LevelData,
  level86 as LevelData,
  level87 as LevelData,
  level88 as LevelData,
  level89 as LevelData,
  level90 as LevelData,
  level91 as LevelData,
  level92 as LevelData,
  level93 as LevelData,
  level94 as LevelData,
  level95 as LevelData,
  level96 as LevelData,
  level97 as LevelData,
  level98 as LevelData,
  level99 as LevelData,
  level100 as LevelData,
  level101 as LevelData,
  level102 as LevelData,
  level103 as LevelData,
  level104 as LevelData,
  level105 as LevelData,
  level106 as LevelData,
  level107 as LevelData,
  level108 as LevelData,
  level109 as LevelData,
  level110 as LevelData,
  level111 as LevelData,
  level112 as LevelData,
  level113 as LevelData,
  level114 as LevelData,
  level115 as LevelData,
  level116 as LevelData,
  level117 as LevelData,
  level118 as LevelData,
  level119 as LevelData,
  ...webLevels,
];

function compareLevels(a: LevelData, b: LevelData): number {
  const worldDiff = WORLD_ORDER.indexOf(a.world as WorldId) - WORLD_ORDER.indexOf(b.world as WorldId);
  if (worldDiff !== 0) return worldDiff;
  const modeDiff = MODE_ORDER.indexOf(a.mode) - MODE_ORDER.indexOf(b.mode);
  if (modeDiff !== 0) return modeDiff;
  return a.order - b.order;
}

function trackForWorld(world: WorldId): TrackId {
  return WORLD_META[world].track;
}

export const levelRegistry: LevelRegistryEntry[] = LEVEL_DATA
  .slice()
  .sort(compareLevels)
  .map((level) => ({
    id: level.id,
    track: trackForWorld(level.world as WorldId),
    world: level.world as WorldId,
    mode: level.mode,
    order: level.order,
    title: level.title,
    levelData: level,
  }));

export const allLevelIds: LevelId[] = levelRegistry.map((entry) => entry.id);

export function getWorlds(): WorldMeta[] {
  return WORLD_ORDER.map((worldId) => WORLD_META[worldId]);
}

export function getLevelById(id: string): LevelData | null {
  return levelRegistry.find((entry) => entry.id === id)?.levelData ?? null;
}

export function getLevelsByWorld(world: WorldId): LevelRegistryEntry[] {
  return levelRegistry.filter((entry) => entry.world === world);
}

export function getLevelsByWorldAndMode(world: WorldId, mode: LevelMode): LevelRegistryEntry[] {
  return levelRegistry.filter((entry) => entry.world === world && entry.mode === mode);
}

export function getNextLevelId(id: string): LevelId | null {
  const entry = levelRegistry.find((item) => item.id === id);
  if (!entry) return null;
  const sameTrackIds = levelRegistry.filter((item) => item.track === entry.track).map((item) => item.id);
  const index = sameTrackIds.indexOf(id);
  return index >= 0 && index < sameTrackIds.length - 1 ? sameTrackIds[index + 1] : null;
}

export function getPreviousLevelId(id: string): LevelId | null {
  const entry = levelRegistry.find((item) => item.id === id);
  if (!entry) return null;
  const sameTrackIds = levelRegistry.filter((item) => item.track === entry.track).map((item) => item.id);
  const index = sameTrackIds.indexOf(id);
  return index > 0 ? sameTrackIds[index - 1] : null;
}

export function getFirstLevelId(): LevelId {
  return allLevelIds[0];
}
