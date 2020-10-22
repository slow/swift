const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...textChannel'] });
   }

   get base() {
      return this.store.get('textChannel');
   }
};
