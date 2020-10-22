const { Structures } = require('discord.js');

module.exports = Structures.extend('Guild', (Guild) => {
   class SwiftGuild extends Guild {
      constructor(...args) {
         super(...args);

         this.settings = this.client.gateways.guilds.get(this.id, true);
      }

      get language() {
         return this.client.languages.get(this.settings.language) || null;
      }

      toJSON() {
         return { ...super.toJSON(), settings: this.settings.toJSON() };
      }
   }

   return SwiftGuild;
});
