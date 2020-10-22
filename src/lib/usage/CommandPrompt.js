const TextPrompt = require('./TextPrompt');

class CommandPrompt extends TextPrompt {
   constructor(message, usage, options) {
      super(message, usage, options);

      this.typing = this.client.options.typing;

      this._setup(this.message.content.slice(this.message.prefixLength).trim().split(' ').slice(1).join(' ').trim());
   }

   run() {
      return this.validateArgs();
   }
}

module.exports = CommandPrompt;
