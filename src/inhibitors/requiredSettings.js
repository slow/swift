const { Inhibitor } = require('@swift/core');

module.exports = class extends Inhibitor {
   run(message, command) {
      if (!command.requiredSettings.length || message.channel.type !== 'text') return;
      const requiredSettings = command.requiredSettings.filter((setting) => message.guild.settings.get(setting) == null);
      if (requiredSettings.length) throw message.language.get('INHIBITOR_REQUIRED_SETTINGS', requiredSettings);
   }
};
