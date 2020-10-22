const Discord = require('discord.js');
const {
   Permissions,
   Permissions: { FLAGS }
} = Discord;
const path = require('path');

const PermissionLevels = require('./permissions/PermissionLevels');

const Schedule = require('./schedule/Schedule');

const ArgumentStore = require('./structures/ArgumentStore');
const CommandStore = require('./structures/CommandStore');
const EventStore = require('./structures/EventStore');
const ExtendableStore = require('./structures/ExtendableStore');
const FinalizerStore = require('./structures/FinalizerStore');
const InhibitorStore = require('./structures/InhibitorStore');
const LanguageStore = require('./structures/LanguageStore');
const MonitorStore = require('./structures/MonitorStore');
const ProviderStore = require('./structures/ProviderStore');
const SerializerStore = require('./structures/SerializerStore');
const TaskStore = require('./structures/TaskStore');

const GatewayDriver = require('./settings/GatewayDriver');

const Schema = require('./settings/schema/Schema');

const SwiftConsole = require('./util/SwiftConsole');
const { DEFAULTS, MENTION_REGEX } = require('./util/constants');
const Stopwatch = require('./util/Stopwatch');
const util = require('./util/util');

const plugins = new Set();

class SwiftClient extends Discord.Client {
   constructor(options = {}) {
      if (!util.isObject(options)) throw new TypeError('The Client Options for Swift must be an object.');
      options = util.mergeDefault(DEFAULTS.CLIENT, options);
      super(options);

      this.userBaseDirectory = path.dirname(require.main.filename);

      this.console = new SwiftConsole(this.options.console);

      this.arguments = new ArgumentStore(this);

      this.commands = new CommandStore(this);

      this.inhibitors = new InhibitorStore(this);

      this.finalizers = new FinalizerStore(this);

      this.monitors = new MonitorStore(this);

      this.languages = new LanguageStore(this);

      this.providers = new ProviderStore(this);

      this.events = new EventStore(this);

      this.extendables = new ExtendableStore(this);

      this.tasks = new TaskStore(this);

      this.serializers = new SerializerStore(this);

      this.pieceStores = new Discord.Collection();

      this.permissionLevels = this.validatePermissionLevels();

      this.gateways = new GatewayDriver(this);

      const { guilds, users, clientStorage } = this.options.gateways;
      const guildSchema = 'schema' in guilds ? guilds.schema : this.constructor.defaultGuildSchema;
      const userSchema = 'schema' in users ? users.schema : this.constructor.defaultUserSchema;
      const clientSchema = 'schema' in clientStorage ? clientStorage.schema : this.constructor.defaultClientSchema;

      const prefixKey = guildSchema.get('prefix');
      if (!prefixKey || prefixKey.default === null) {
         guildSchema.add('prefix', 'string', { array: Array.isArray(this.options.prefix), default: this.options.prefix });
      }

      const languageKey = guildSchema.get('language');
      if (!languageKey || languageKey.default === null) {
         guildSchema.add('language', 'language', { default: this.options.language });
      }

      guildSchema.add('disableNaturalPrefix', 'boolean', { configurable: Boolean(this.options.regexPrefix) });

      this.gateways
         .register('guilds', { ...guilds, schema: guildSchema })
         .register('users', { ...users, schema: userSchema })
         .register('clientStorage', { ...clientStorage, schema: clientSchema });

      this.settings = null;

      this.application = null;

      this.registerStore(this.commands)
         .registerStore(this.inhibitors)
         .registerStore(this.finalizers)
         .registerStore(this.monitors)
         .registerStore(this.languages)
         .registerStore(this.providers)
         .registerStore(this.events)
         .registerStore(this.extendables)
         .registerStore(this.tasks)
         .registerStore(this.arguments)
         .registerStore(this.serializers);

      const coreDirectory = path.join(__dirname, '../');
      for (const store of this.pieceStores.values()) store.registerCoreDirectory(coreDirectory);

      this.schedule = new Schedule(this);

      this.ready = false;

      this.mentionPrefix = null;

      for (const plugin of plugins) plugin.call(this);
   }

   get invite() {
      const permissions = new Permissions(this.constructor.basePermissions).add(...this.commands.map((command) => command.requiredPermissions))
         .bitfield;
      return `https://discordapp.com/oauth2/authorize?client_id=${this.application.id}&permissions=${permissions}&scope=bot`;
   }

   get owners() {
      const owners = new Set();
      for (const owner of this.options.owners) {
         const user = this.users.cache.get(owner);
         if (user) owners.add(user);
      }
      return owners;
   }

   async fetchApplication() {
      this.application = await super.fetchApplication();
      return this.application;
   }

   validatePermissionLevels() {
      const permissionLevels = this.options.permissionLevels || this.constructor.defaultPermissionLevels;
      if (!(permissionLevels instanceof PermissionLevels)) throw new Error('permissionLevels must be an instance of the PermissionLevels class');
      if (permissionLevels.isValid()) return permissionLevels;
      throw new Error(permissionLevels.debug());
   }

   registerStore(store) {
      this.pieceStores.set(store.name, store);
      return this;
   }

   unregisterStore(storeName) {
      this.pieceStores.delete(storeName);
      return this;
   }

   async login(token) {
      const timer = new Stopwatch();
      const loaded = await Promise.all(this.pieceStores.map(async (store) => `Loaded ${await store.loadAll()} ${store.name}.`)).catch((err) => {
         console.error(err);
         process.exit();
      });
      this.emit('log', loaded.join('\n'));

      await this.providers.init();
      await this.gateways.init();

      this.emit('log', `Loaded in ${timer.stop()}.`);
      return super.login(token);
   }

   sweepMessages(lifetime = this.options.messageCacheLifetime, commandLifetime = this.options.commandMessageLifetime) {
      if (typeof lifetime !== 'number' || isNaN(lifetime)) throw new TypeError('The lifetime must be a number.');
      if (lifetime <= 0) {
         this.emit('debug', "Didn't sweep messages - lifetime is unlimited");
         return -1;
      }

      const lifetimeMs = lifetime * 1000;
      const commandLifetimeMs = commandLifetime * 1000;
      const now = Date.now();
      let channels = 0;
      let messages = 0;
      let commandMessages = 0;

      for (const channel of this.channels.cache.values()) {
         if (!channel.messages) continue;
         channels++;

         channel.messages.cache.sweep((message) => {
            if ((message.command || message.author === this.user) && now - (message.editedTimestamp || message.createdTimestamp) > commandLifetimeMs)
               return commandMessages++;
            if (!message.command && message.author !== this.user && now - (message.editedTimestamp || message.createdTimestamp) > lifetimeMs)
               return messages++;
            return false;
         });
      }

      this.emit(
         'debug',
         `Swept ${messages} messages older than ${lifetime} seconds and ${commandMessages} command messages older than ${commandLifetime} seconds in ${channels} text-based channels`
      );
      return messages;
   }

   static use(mod) {
      const plugin = mod[this.plugin];
      if (!util.isFunction(plugin)) throw new TypeError('The provided module does not include a plugin function');
      plugins.add(plugin);
      return this;
   }
}

module.exports = SwiftClient;

SwiftClient.plugin = Symbol('SwiftPlugin');

SwiftClient.basePermissions = new Permissions(3072);

SwiftClient.defaultPermissionLevels = new PermissionLevels()
   .add(0, () => true)
   .add(6, ({ guild, member }) => guild && member.permissions.has(FLAGS.MANAGE_GUILD), { fetch: true })
   .add(7, ({ guild, member }) => guild && member === guild.owner, { fetch: true })
   .add(9, ({ author, client }) => client.owners.has(author), { break: true })
   .add(10, ({ author, client }) => client.owners.has(author));

SwiftClient.defaultGuildSchema = new Schema()
   .add('prefix', 'string')
   .add('language', 'language')
   .add('disableNaturalPrefix', 'boolean')
   .add('disabledCommands', 'command', {
      array: true,
      filter: (client, command, piece, language) => {
         if (command.guarded) throw language.get('COMMAND_CONF_GUARDED', command.name);
      }
   });

SwiftClient.defaultUserSchema = new Schema();

SwiftClient.defaultClientSchema = new Schema()
   .add('userBlacklist', 'user', { array: true })
   .add('guildBlacklist', 'string', { array: true, filter: (__, value) => !MENTION_REGEX.snowflake.test(value) })
   .add('schedules', 'any', { array: true });
