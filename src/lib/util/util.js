const { promisify } = require('util');
const { exec } = require('child_process');
const { Guild, GuildChannel, Message } = require('discord.js');

const zws = String.fromCharCode(8203);
let sensitivePattern;
const TOTITLECASE = /[A-Za-zÀ-ÖØ-öø-ÿ]\S*/g;
const REGEXPESC = /[-/\\^$*+?.()|[\]{}]/g;

class Util {
   constructor() {
      throw new Error('This class may not be initiated with new');
   }

   static codeBlock(lang, expression) {
      return `\`\`\`${lang}\n${expression || zws}\`\`\``;
   }

   static clean(text) {
      return text.replace(sensitivePattern, '「ｒｅｄａｃｔｅｄ」').replace(/`/g, `\`${zws}`).replace(/@/g, `@${zws}`);
   }

   static initClean(client) {
      sensitivePattern = new RegExp(Util.regExpEsc(client.token), 'gi');
   }

   static toTitleCase(str) {
      return str.replace(TOTITLECASE, (txt) => Util.titleCaseVariants[txt] || txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
   }

   static regExpEsc(str) {
      return str.replace(REGEXPESC, '\\$&');
   }

   static chunk(entries, chunkSize) {
      if (!Array.isArray(entries)) throw new TypeError('entries is not an array.');
      if (!Number.isInteger(chunkSize)) throw new TypeError('chunkSize is not an integer.');
      const clone = entries.slice();
      const chunks = [];
      while (clone.length) chunks.push(clone.splice(0, chunkSize));
      return chunks;
   }

   static mergeObjects(objTarget = {}, objSource) {
      for (const key in objSource)
         objTarget[key] = Util.isObject(objSource[key]) ? Util.mergeObjects(objTarget[key], objSource[key]) : objSource[key];
      return objTarget;
   }

   static deepClone(source) {
      if (source === null || Util.isPrimitive(source)) return source;
      if (Array.isArray(source)) {
         const output = [];
         for (const value of source) output.push(Util.deepClone(value));
         return output;
      }
      if (Util.isObject(source)) {
         const output = {};
         for (const [key, value] of Object.entries(source)) output[key] = Util.deepClone(value);
         return output;
      }
      if (source instanceof Map) {
         const output = new source.constructor();
         for (const [key, value] of source.entries()) output.set(key, Util.deepClone(value));
         return output;
      }
      if (source instanceof Set) {
         const output = new source.constructor();
         for (const value of source.values()) output.add(Util.deepClone(value));
         return output;
      }
      return source;
   }

   static isFunction(input) {
      return typeof input === 'function';
   }

   static isClass(input) {
      return typeof input === 'function' && typeof input.prototype === 'object' && input.toString().substring(0, 5) === 'class';
   }

   static isObject(input) {
      return input && input.constructor === Object;
   }

   static isNumber(input) {
      return typeof input === 'number' && !isNaN(input) && Number.isFinite(input);
   }

   static isPrimitive(value) {
      return Util.PRIMITIVE_TYPES.includes(typeof value);
   }

   static isThenable(input) {
      if (!input) return false;
      return input instanceof Promise || (input !== Promise.prototype && Util.isFunction(input.then) && Util.isFunction(input.catch));
   }

   static tryParse(value) {
      try {
         return JSON.parse(value);
      } catch (err) {
         return value;
      }
   }

   static makeObject(path, value, obj = {}) {
      if (path.indexOf('.') === -1) {
         obj[path] = value;
      } else {
         const route = path.split('.');
         const lastKey = route.pop();
         let reference = obj;
         for (const key of route) {
            if (!reference[key]) reference[key] = {};
            reference = reference[key];
         }
         reference[lastKey] = value;
      }
      return obj;
   }

   static objectToTuples(object, prefix = '') {
      const entries = [];
      for (const [key, value] of Object.entries(object)) {
         if (Util.isObject(value)) {
            entries.push(...Util.objectToTuples(value, `${prefix}${key}.`));
         } else {
            entries.push([`${prefix}${key}`, value]);
         }
      }

      return entries;
   }

   static arraysStrictEquals(arr1, arr2) {
      if (arr1 === arr2) return true;
      if (arr1.length !== arr2.length) return false;

      for (let i = 0; i < arr1.length; i++) {
         if (arr1[i] !== arr2[i]) return false;
      }
      return true;
   }

   static mergeDefault(def, given) {
      if (!given) return Util.deepClone(def);
      for (const key in def) {
         if (typeof given[key] === 'undefined') given[key] = Util.deepClone(def[key]);
         else if (Util.isObject(given[key])) given[key] = Util.mergeDefault(def[key], given[key]);
      }

      return given;
   }

   static resolveGuild(client, guild) {
      const type = typeof guild;
      if (type === 'object' && guild !== null) {
         if (guild instanceof Guild) return guild;
         if (guild instanceof GuildChannel || guild instanceof Message) return guild.guild;
      } else if (type === 'string' && /^\d{17,19}$/.test(guild)) {
         return client.guilds.cache.get(guild) || null;
      }
      return null;
   }
}

Util.exec = promisify(exec);

Util.sleep = promisify(setTimeout);

Util.titleCaseVariants = {
   textchannel: 'TextChannel',
   voicechannel: 'VoiceChannel',
   categorychannel: 'CategoryChannel',
   guildmember: 'GuildMember'
};

Util.PRIMITIVE_TYPES = ['string', 'bigint', 'number', 'boolean'];

module.exports = Util;
