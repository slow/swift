const {
   Structures,
   Collection,
   APIMessage,
   Permissions: { FLAGS }
} = require('discord.js');
const { regExpEsc } = require('../util/util');

module.exports = Structures.extend('Message', (Message) => {
   class SwiftMessage extends Message {
      constructor(...args) {
         super(...args);

         this.command = this.command || null;

         this.commandText = this.commandText || null;

         this.prefix = this.prefix || null;

         this.prefixLength = typeof this.prefixLength === 'number' ? this.prefixLength : null;

         this.prompter = this.prompter || null;

         this._responses = [];
      }

      get responses() {
         return this._responses.filter((msg) => !msg.deleted);
      }

      get args() {
         return this.prompter ? this.prompter.args : [];
      }

      get params() {
         return this.prompter ? this.prompter.params : [];
      }

      get flagArgs() {
         return this.prompter ? this.prompter.flags : {};
      }

      get reprompted() {
         return this.prompter ? this.prompter.reprompted : false;
      }

      get reactable() {
         if (!this.guild) return true;
         return this.channel.readable && this.channel.permissionsFor(this.guild.me).has([FLAGS.ADD_REACTIONS, FLAGS.READ_MESSAGE_HISTORY], false);
      }

      async usableCommands() {
         const col = new Collection();
         await Promise.all(
            this.client.commands.map((command) =>
               this.client.inhibitors
                  .run(this, command, true)
                  .then(() => {
                     col.set(command.name, command);
                  })
                  .catch(() => {
                     // noop
                  })
            )
         );
         return col;
      }

      async hasMinPermission(min) {
         const { permission } = await this.client.permissionLevels.run(this, min);
         return permission;
      }

      async sendMessage(content, options) {
         const combinedOptions = APIMessage.transformOptions(content, options);

         if ('files' in combinedOptions) return this.channel.send(combinedOptions);

         const newMessages = new APIMessage(this.channel, combinedOptions)
            .resolveData()
            .split()
            .map((mes) => {
               mes.data.embed = mes.data.embed || null;
               mes.data.content = mes.data.content || null;
               return mes;
            });

         const { responses } = this;
         const promises = [];
         const max = Math.max(newMessages.length, responses.length);

         for (let i = 0; i < max; i++) {
            if (i >= newMessages.length) responses[i].delete();
            else if (responses.length > i) promises.push(responses[i].edit(newMessages[i]));
            else promises.push(this.channel.send(newMessages[i]));
         }

         const newResponses = await Promise.all(promises);

         this._responses = newMessages.map((val, i) => responses[i] || newResponses[i]);

         return newResponses.length === 1 ? newResponses[0] : newResponses;
      }

      sendEmbed(embed, content, options) {
         return this.sendMessage(APIMessage.transformOptions(content, options, { embed }));
      }

      sendCode(code, content, options) {
         return this.sendMessage(APIMessage.transformOptions(content, options, { code }));
      }

      send(content, options) {
         return this.sendMessage(content, options);
      }

      sendLocale(key, localeArgs = [], options = {}) {
         if (!Array.isArray(localeArgs)) [options, localeArgs] = [localeArgs, []];
         return this.sendMessage(APIMessage.transformOptions(this.language.get(key, ...localeArgs), undefined, options));
      }

      patch(data) {
         super.patch(data);
         this.language = this.guild ? this.guild.language : this.client.languages.default;
         this._parseCommand();
      }

      _patch(data) {
         super._patch(data);

         this.language = this.guild ? this.guild.language : this.client.languages.default;

         this.guildSettings = this.guild ? this.guild.settings : this.client.gateways.guilds.defaults;

         this._parseCommand();
      }

      _parseCommand() {
         this.prefix = null;
         this.prefixLength = null;
         this.commandText = null;
         this.command = null;
         this.prompter = null;

         try {
            const prefix = this._mentionPrefix() || this._customPrefix() || this._naturalPrefix() || this._prefixLess();

            if (!prefix) return;

            this.prefix = prefix.regex;
            this.prefixLength = prefix.length;
            this.commandText = this.content.slice(prefix.length).trim().split(' ')[0].toLowerCase();
            this.command = this.client.commands.get(this.commandText) || null;

            if (!this.command) return;

            this.prompter = this.command.usage.createPrompt(this, {
               flagSupport: this.command.flagSupport,
               quotedStringSupport: this.command.quotedStringSupport,
               time: this.command.promptTime,
               limit: this.command.promptLimit
            });
         } catch (error) {
            return;
         }
      }

      _customPrefix() {
         if (!this.guildSettings.prefix) return null;
         for (const prf of Array.isArray(this.guildSettings.prefix) ? this.guildSettings.prefix : [this.guildSettings.prefix]) {
            const testingPrefix =
               this.constructor.prefixes.get(prf) || this.constructor.generateNewPrefix(prf, this.client.options.prefixCaseInsensitive ? 'i' : '');
            if (testingPrefix.regex.test(this.content)) return testingPrefix;
         }
         return null;
      }

      _mentionPrefix() {
         const mentionPrefix = this.client.mentionPrefix.exec(this.content);
         return mentionPrefix ? { length: mentionPrefix[0].length, regex: this.client.mentionPrefix } : null;
      }

      _naturalPrefix() {
         if (this.guildSettings.disableNaturalPrefix || !this.client.options.regexPrefix) return null;
         const results = this.client.options.regexPrefix.exec(this.content);
         return results ? { length: results[0].length, regex: this.client.options.regexPrefix } : null;
      }

      _prefixLess() {
         return this.client.options.noPrefixDM && this.channel.type === 'dm' ? { length: 0, regex: null } : null;
      }

      static generateNewPrefix(prefix, flags) {
         const prefixObject = { length: prefix.length, regex: new RegExp(`^${regExpEsc(prefix)}`, flags) };
         this.prefixes.set(prefix, prefixObject);
         return prefixObject;
      }
   }

   SwiftMessage.prefixes = new Map();

   return SwiftMessage;
});
