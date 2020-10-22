const Piece = require('./base/Piece');

class Monitor extends Piece {
   constructor(store, file, directory, options = {}) {
      super(store, file, directory, options);

      this.allowedTypes = options.allowedTypes;

      this.ignoreBots = options.ignoreBots;

      this.ignoreSelf = options.ignoreSelf;

      this.ignoreOthers = options.ignoreOthers;

      this.ignoreWebhooks = options.ignoreWebhooks;

      this.ignoreEdits = options.ignoreEdits;

      this.ignoreBlacklistedUsers = options.ignoreBlacklistedUsers;

      this.ignoreBlacklistedGuilds = options.ignoreBlacklistedGuilds;
   }

   async _run(message) {
      try {
         await this.run(message);
      } catch (err) {
         this.client.emit('monitorError', message, this, err);
      }
   }

   run() {
      throw new Error(`The run method has not been implemented by ${this.type}:${this.name}.`);
   }

   shouldRun(message) {
      return (
         this.enabled &&
         this.allowedTypes.includes(message.type) &&
         !(this.ignoreBots && message.author.bot) &&
         !(this.ignoreSelf && this.client.user === message.author) &&
         !(this.ignoreOthers && this.client.user !== message.author) &&
         !(this.ignoreWebhooks && message.webhookID) &&
         !(this.ignoreEdits && message._edits.length) &&
         !(this.ignoreBlacklistedUsers && this.client.settings.userBlacklist.includes(message.author.id)) &&
         !(this.ignoreBlacklistedGuilds && message.guild && this.client.settings.guildBlacklist.includes(message.guild.id))
      );
   }

   toJSON() {
      return {
         ...super.toJSON(),
         ignoreBots: this.ignoreBots,
         ignoreSelf: this.ignoreSelf,
         ignoreOthers: this.ignoreOthers,
         ignoreWebhooks: this.ignoreWebhooks,
         ignoreEdits: this.ignoreEdits,
         ignoreBlacklistedUsers: this.ignoreBlacklistedUsers,
         ignoreBlacklistedGuilds: this.ignoreBlacklistedGuilds
      };
   }
}

module.exports = Monitor;
