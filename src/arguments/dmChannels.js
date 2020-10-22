const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...dmChannel'] });
   }

   get base() {
      return this.store.get('dmChannel');
   }
};
