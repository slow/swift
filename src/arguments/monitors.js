const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...monitor'] });
   }

   get base() {
      return this.store.get('monitor');
   }
};
