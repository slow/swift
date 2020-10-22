const Usage = require('./Usage');
const CommandPrompt = require('./CommandPrompt');

class CommandUsage extends Usage {
   constructor(client, usageString, usageDelim, command) {
      super(client, usageString, usageDelim);

      this.names = [command.name, ...command.aliases];

      this.commands = this.names.length === 1 ? this.names[0] : `《${this.names.join('|')}》`;

      this.nearlyFullUsage = `${this.commands}${this.deliminatedUsage}`;
   }

   createPrompt(message, options = {}) {
      return new CommandPrompt(message, this, options);
   }

   fullUsage(message) {
      let prefix = message.prefixLength ? message.content.slice(0, message.prefixLength) : message.guildSettings.prefix;
      if (message.prefix === this.client.mentionPrefix) prefix = `@${this.client.user.tag}`;
      else if (Array.isArray(prefix)) [prefix] = prefix;
      return `${prefix.length !== 1 ? `${prefix} ` : prefix}${this.nearlyFullUsage}`;
   }

   toString() {
      return this.nearlyFullUsage;
   }
}

module.exports = CommandUsage;
