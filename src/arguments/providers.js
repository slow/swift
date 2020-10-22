const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...provider'] });
   }

   get base() {
      return this.store.get('provider');
   }
};
