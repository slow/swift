const { pathExists } = require('fs-nextra');
const { join } = require('path');
const Piece = require('./base/Piece');
const { mergeDefault, isClass } = require('../util/util');

class Language extends Piece {
   get(term, ...args) {
      if (!this.enabled && this !== this.store.default) return this.store.default.get(term, ...args);
      const value = this.language[term];

      switch (typeof value) {
         case 'function':
            return value(...args);
         case 'undefined':
            if (this === this.store.default) return this.language.DEFAULT(term);
            return `${this.language.DEFAULT(term)}\n\n**${this.language.DEFAULT_LANGUAGE}:**\n${this.store.default.get(term, ...args)}`;
         default:
            return value;
      }
   }

   async init() {
      for (const core of this.store.coreDirectories) {
         const loc = join(core, ...this.file);
         if (this.dir !== core && (await pathExists(loc))) {
            try {
               const CorePiece = ((req) => req.default || req)(require(loc));
               if (!isClass(CorePiece)) return;
               const coreLang = new CorePiece(this.store, this.file, core);
               this.language = mergeDefault(coreLang.language, this.language);
            } catch (error) {
               return;
            }
         }
      }
      return;
   }
}

module.exports = Language;
