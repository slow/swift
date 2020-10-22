const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...command'] });
   }

   get base() {
      return this.store.get('command');
   }
};
