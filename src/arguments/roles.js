const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...role'] });
   }

   get base() {
      return this.store.get('role');
   }
};
