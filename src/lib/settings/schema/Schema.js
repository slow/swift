const { isFunction, deepClone } = require('../../util/util');

class Schema extends Map {
   constructor(basePath = '') {
      super();

      Object.defineProperty(this, 'path', { value: basePath });

      Object.defineProperty(this, 'type', { value: 'Folder' });
   }

   get configurableKeys() {
      const keys = [];
      for (const piece of this.values(true)) if (piece.configurable) keys.push(piece.path);
      return keys;
   }

   get defaults() {
      return Object.assign({}, ...[...this.values()].map((piece) => ({ [piece.key]: piece.defaults || deepClone(piece.default) })));
   }

   get paths() {
      const paths = new Map();
      for (const piece of this.values(true)) paths.set(piece.path, piece);
      return paths;
   }

   add(key, typeOrCallback, options = {}) {
      if (!typeOrCallback) throw new Error(`The type for ${key} must be a string for pieces, and a callback for folders`);

      let Piece;
      let type;
      let callback;
      if (isFunction(typeOrCallback)) {
         callback = typeOrCallback;
         type = 'Folder';
         Piece = require('./SchemaFolder');
      } else if (typeof typeOrCallback === 'string') {
         Piece = require('./SchemaPiece');
         type = typeOrCallback;
         callback = null;
      }

      const previous = super.get(key);
      if (previous) {
         if (type === 'Folder') {
            if (previous.type !== 'Folder')
               throw new Error(`The type for ${key} conflicts with the previous value, expected type Folder, got ${previous.type}.`);
            callback(previous);
            return this;
         }

         if (previous.type === 'Folder')
            throw new Error(`The type for ${key} conflicts with the previous value, expected a non-Folder, got ${previous.type}.`);

         previous.edit({ type, ...options });
         return this;
      }
      const piece = new Piece(this, key, type, options);

      if (callback) callback(piece);

      this.set(key, piece);

      return this;
   }

   remove(key) {
      super.delete(key);
      return this;
   }

   get(key) {
      const path = typeof key === 'string' ? key.split('.') : key;
      const [now, ...next] = path;
      const piece = super.get(now);
      if (!piece) return undefined;
      return next.length && piece.type === 'Folder' ? piece.get(next) : piece;
   }

   *keys(recursive = false) {
      if (recursive) {
         for (const [key, value] of super.entries()) {
            if (value.type === 'Folder') yield* value.keys(recursive);
            else yield key;
         }
      } else {
         yield* super.keys();
      }
   }

   *values(recursive = false) {
      if (recursive) {
         for (const value of super.values()) {
            if (value.type === 'Folder') yield* value.values(recursive);
            else yield value;
         }
      } else {
         yield* super.values();
      }
   }

   *entries(recursive = false) {
      if (recursive) {
         for (const [key, value] of super.entries()) {
            if (value.type === 'Folder') yield* value.entries(recursive);
            else yield [key, value];
         }
      } else {
         yield* super.entries();
      }
   }

   toJSON() {
      return Object.assign({}, ...[...this.values()].map((piece) => ({ [piece.key]: piece.toJSON() })));
   }
}

module.exports = Schema;
