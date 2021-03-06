const { Argument } = require('swift');

module.exports = class extends Argument {
   async run(arg, possible, message, custom) {
      try {
         const resolved = await custom(arg, possible, message, message.params);
         return resolved;
      } catch (err) {
         if (err) throw err;
         throw message.language.get('RESOLVER_INVALID_CUSTOM', possible.name, possible.type);
      }
   }
};
