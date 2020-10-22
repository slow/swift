const Piece = require('./base/Piece');

class Extendable extends Piece {
   constructor(store, file, directory, options = {}) {
      super(store, file, directory, options);

      const staticPropertyNames = Object.getOwnPropertyNames(this.constructor).filter((name) => !['length', 'prototype', 'name'].includes(name));
      const instancePropertyNames = Object.getOwnPropertyNames(this.constructor.prototype).filter((name) => name !== 'constructor');

      this.staticPropertyDescriptors = Object.assign(
         {},
         ...staticPropertyNames.map((name) => ({ [name]: Object.getOwnPropertyDescriptor(this.constructor, name) }))
      );

      this.instancePropertyDescriptors = Object.assign(
         {},
         ...instancePropertyNames.map((name) => ({ [name]: Object.getOwnPropertyDescriptor(this.constructor.prototype, name) }))
      );

      this.originals = new Map(
         options.appliesTo.map((structure) => [
            structure,
            {
               staticPropertyDescriptors: Object.assign(
                  {},
                  ...staticPropertyNames.map((name) => ({ [name]: Object.getOwnPropertyDescriptor(structure, name) || { value: undefined } }))
               ),
               instancePropertyDescriptors: Object.assign(
                  {},
                  ...instancePropertyNames.map((name) => ({
                     [name]: Object.getOwnPropertyDescriptor(structure.prototype, name) || { value: undefined }
                  }))
               )
            }
         ])
      );
   }

   get appliesTo() {
      return [...this.originals.keys()];
   }

   async init() {
      if (this.enabled) this.enable(true);
   }

   disable() {
      if (this.client.listenerCount('pieceDisabled')) this.client.emit('pieceDisabled', this);
      this.enabled = false;
      for (const [structure, originals] of this.originals) {
         Object.defineProperties(structure, originals.staticPropertyDescriptors);
         Object.defineProperties(structure.prototype, originals.instancePropertyDescriptors);
      }
      return this;
   }

   enable(init = false) {
      if (!init && this.client.listenerCount('pieceEnabled')) this.client.emit('pieceEnabled', this);
      this.enabled = true;
      for (const structure of this.originals.keys()) {
         Object.defineProperties(structure, this.staticPropertyDescriptors);
         Object.defineProperties(structure.prototype, this.instancePropertyDescriptors);
      }
      return this;
   }

   toJSON() {
      return {
         ...super.toJSON(),
         appliesTo: this.appliesTo.map((fn) => fn.name)
      };
   }
}

module.exports = Extendable;
