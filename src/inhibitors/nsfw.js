const { Inhibitor } = require('swift');

module.exports = class extends Inhibitor {
   run(message, command) {
      if (command.nsfw && !message.channel.nsfw) throw message.language.get('INHIBITOR_NSFW');
   }
};
