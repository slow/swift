const Piece = require('./base/Piece');

class Finalizer extends Piece {
   async _run(message, command, response, runTime) {
      try {
         await this.run(message, command, response, runTime);
      } catch (err) {
         this.client.emit('finalizerError', message, command, response, runTime, this, err);
      }
   }

   run() {
      throw new Error(`The run method has not been implemented by ${this.type}:${this.name}.`);
   }
}

module.exports = Finalizer;
