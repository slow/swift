const { MultiArgument } = require('swift');

module.exports = class extends MultiArgument {
   constructor(...args) {
      super(...args, { aliases: ['...voiceChannel'] });
   }

   get base() {
      return this.store.get('voiceChannel');
   }
};
