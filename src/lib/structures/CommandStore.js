const Command = require('./Command');
const AliasStore = require('./base/AliasStore');

class CommandStore extends AliasStore {
   constructor(client) {
      super(client, 'commands', Command);
   }
}

module.exports = CommandStore;
