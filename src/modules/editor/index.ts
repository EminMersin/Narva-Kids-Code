// src/modules/editor/index.ts
import { Blockly } from './blockly';
import { CodeMirror } from './codemirror';
import { Sync } from './sync';
import { Toolbox } from './toolbox';

/** Temel editor sınıfı */
export class Editor {
  private blockly: Blockly;
  private codemirror: CodeMirror;
  private sync: Sync;
  private toolbox: Toolbox;

  constructor() {
    // Yaratıcı başlangıç ayarları
    this.blockly = new Blockly('blockly-container');
    this.codemirror = new CodeMirror('code-editor', {
      lineNumbers: true,
      theme: 'default'
    });
    this.sync = new Sync();
    this.toolbox = new Toolbox();
  }

  /** Blok → kod çevmesi */
  async compileBlocksToCode(): Promise<string> {
    try {
      const blockCode = this.blockly.getPythonCode(); // Blockly'den kod üret
      const validated = this.sync.validate(blockCode); // Güvenlik kontrolü
      if (!validated.isValid) throw validated.errors;
      await this.codemirror.setValue(blockCode); // Coğumu başlat
      return blockCode;
    } catch (error) {
      console.error('[Editor] Compilation failed:', error);
      throw error;
    }
  }

  /** Kod → blok çevmesi (sınırlı destek) */
  convertCodeToBlocks(code: string): void {
    // MVP'da sadece basit dönüşüm
    const blocks = this.toolbox.convertToBlocks(code);
    this.blockly.addBlocks(blocks);
  }

  /** Editörü temizle */
  clear(): void {
    this.blockly.clear();
    this.codemirror.setValue('');
  }
}
