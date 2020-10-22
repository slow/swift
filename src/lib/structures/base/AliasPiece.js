const Piece = require('./Piece');

class AliasPiece extends Piece {
   constructor(store, file, directory, options = {}) {
      super(store, file, directory, options);

      this.aliases = options.aliases;
   }

   toJSON() {
      return {
         ...super.toJSON(),
         aliases: this.aliases.slice(0)
      };
   }
}

module.exports = AliasPiece;
