const { Structures } = require('discord.js');

module.exports = Structures.extend('User', (User) => {
   class SwiftUser extends User {
      constructor(...args) {
         super(...args);

         this.settings = this.client.gateways.users.get(this.id, true);
      }

      toJSON() {
         return { ...super.toJSON(), settings: this.settings };
      }
   }

   return SwiftUser;
});
