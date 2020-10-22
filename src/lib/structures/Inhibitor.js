const Piece = require('./base/Piece');

class Inhibitor extends Piece {
   constructor(store, file, directory, options = {}) {
      super(store, file, directory, options);

      this.spamProtection = options.spamProtection;
   }

   async _run(message, command) {
      try {
         return await this.run(message, command);
      } catch (err) {
         return err;
      }
   }

   async run() {
      throw new Error(`The run method has not been implemented by ${this.type}:${this.name}.`);
   }

   toJSON() {
      return {
         ...super.toJSON(),
         spamProtection: this.spamProtection
      };
   }
}

module.exports = Inhibitor;
