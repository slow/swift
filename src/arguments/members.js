const { MultiArgument } = require('@swift/core');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...member'] });
   }

   get base() {
      return this.store.get('member');
   }
};
