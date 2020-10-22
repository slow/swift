const { Permissions } = require('discord.js');
const AliasPiece = require('./base/AliasPiece');
const Usage = require('../usage/Usage');
const CommandUsage = require('../usage/CommandUsage');
const { isFunction } = require('../util/util');

class Command extends AliasPiece {
   constructor(store, file, directory, options = {}) {
      super(store, file, directory, options);

      this.name = this.name.toLowerCase();

      if (options.autoAliases) {
         if (this.name.includes('-')) this.aliases.push(this.name.replace(/-/g, ''));
         for (const alias of this.aliases) if (alias.includes('-')) this.aliases.push(alias.replace(/-/g, ''));
      }

      this.requiredPermissions = new Permissions(options.requiredPermissions).freeze();

      this.deletable = options.deletable;

      this.description = isFunction(options.description)
         ? (language = this.client.languages.default) => options.description(language)
         : options.description;

      this.extendedHelp = isFunction(options.extendedHelp)
         ? (language = this.client.languages.default) => options.extendedHelp(language)
         : options.extendedHelp;

      this.fullCategory = file.slice(0, -1);

      this.guarded = options.guarded;

      this.hidden = options.hidden;

      this.nsfw = options.nsfw;

      this.permissionLevel = options.permissionLevel;

      this.promptLimit = options.promptLimit;

      this.promptTime = options.promptTime;

      this.flagSupport = options.flagSupport;

      this.quotedStringSupport = options.quotedStringSupport;

      this.requiredSettings = options.requiredSettings;

      this.runIn = options.runIn;

      this.subcommands = options.subcommands;

      this.usage = new CommandUsage(this.client, options.usage, options.usageDelim, this);
      
      this.friendlyUsage = options.friendlyUsage;

      this.cooldownLevel = options.cooldownLevel;

      if (!['author', 'channel', 'guild'].includes(this.cooldownLevel)) throw new Error('Invalid cooldownLevel');

      this.bucket = options.bucket;

      this.cooldown = options.cooldown;
   }

   get category() {
      return this.fullCategory[0] || 'General';
   }

   get subCategory() {
      return this.fullCategory[1] || 'General';
   }

   get usageDelim() {
      return this.usage.usageDelim;
   }

   get usageString() {
      return this.usage.usageString;
   }

   definePrompt(usageString, usageDelim) {
      return new Usage(this.client, usageString, usageDelim);
   }

   createCustomResolver(type, resolver) {
      this.usage.createCustomResolver(type, resolver);
      return this;
   }

   customizeResponse(name, response) {
      this.usage.customizeResponse(name, response);
      return this;
   }

   async run() {
      // Defined in extension Classes
      throw new Error(`The run method has not been implemented by ${this.type}:${this.name}.`);
   }

   toJSON() {
      return {
         ...super.toJSON(),
         requiredPermissions: this.requiredPermissions.toArray(false),
         bucket: this.bucket,
         category: this.category,
         cooldown: this.cooldown,
         deletable: this.deletable,
         description: isFunction(this.description) ? this.description() : this.description,
         extendedHelp: isFunction(this.extendedHelp) ? this.extendedHelp() : this.extendedHelp,
         fullCategory: this.fullCategory,
         guarded: this.guarded,
         hidden: this.hidden,
         nsfw: this.nsfw,
         permissionLevel: this.permissionLevel,
         promptLimit: this.promptLimit,
         promptTime: this.promptTime,
         quotedStringSupport: this.quotedStringSupport,
         requiredSettings: this.requiredSettings.slice(0),
         runIn: this.runIn.slice(0),
         subCategory: this.subCategory,
         subcommands: this.subcommands,
         usage: {
            usageString: this.usage.usageString,
            usageDelim: this.usage.usageDelim,
            nearlyFullUsage: this.usage.nearlyFullUsage
         },
         friendlyUsage: this.friendlyUsage,
         usageDelim: this.usageDelim,
         usageString: this.usageString
      };
   }
}

module.exports = Command;
