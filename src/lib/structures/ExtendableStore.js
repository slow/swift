const Extendable = require('./Extendable');
const Store = require('./base/Store');

class ExtendableStore extends Store {
   constructor(client) {
      super(client, 'extendables', Extendable);
   }

   delete(name) {
      const extendable = this.resolve(name);
      if (!extendable) return false;
      extendable.disable();
      return super.delete(extendable);
   }

   clear() {
      for (const extendable of this.values()) this.delete(extendable);
   }

   set(piece) {
      const extendable = super.set(piece);
      if (!extendable) return undefined;
      extendable.init();
      return extendable;
   }
}

module.exports = ExtendableStore;
