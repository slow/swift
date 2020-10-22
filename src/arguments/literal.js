const { Argument } = require('swift');

module.exports = class extends Argument {
   run(arg, possible, message) {
      if (arg.toLowerCase() === possible.name.toLowerCase()) return possible.name;
      throw message.language.get('RESOLVER_INVALID_LITERAL', possible.name);
   }
};
