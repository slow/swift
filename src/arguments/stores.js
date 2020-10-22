const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...store'] });
   }

   get base() {
      return this.store.get('store');
   }
};
