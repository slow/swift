const { mergeDefault } = require('../../util/util');
const { join } = require('path');

class Piece {
   constructor(store, file, directory, options = {}) {
      const defaults = store.client.options.pieceDefaults[store.name];
      if (defaults) options = mergeDefault(defaults, options);

      this.client = store.client;

      this.file = file;

      this.name = options.name || file[file.length - 1].slice(0, -3);

      this.enabled = options.enabled;

      this.store = store;

      this.directory = directory;
   }

   get type() {
      return this.store.name.slice(0, -1);
   }

   get path() {
      return join(this.directory, ...this.file);
   }

   async reload() {
      const piece = this.store.load(this.directory, this.file);
      await piece.init();
      if (this.client.listenerCount('pieceReloaded')) this.client.emit('pieceReloaded', piece);
      return piece;
   }

   unload() {
      if (this.client.listenerCount('pieceUnloaded')) this.client.emit('pieceUnloaded', this);
      return this.store.delete(this);
   }

   disable() {
      if (this.client.listenerCount('pieceDisabled')) this.client.emit('pieceDisabled', this);
      this.enabled = false;
      return this;
   }

   enable() {
      if (this.client.listenerCount('pieceEnabled')) this.client.emit('pieceEnabled', this);
      this.enabled = true;
      return this;
   }

   async init() {}

   toString() {
      return this.name;
   }

   toJSON() {
      return {
         directory: this.directory,
         file: this.file,
         path: this.path,
         name: this.name,
         type: this.type,
         enabled: this.enabled
      };
   }
}

module.exports = Piece;
