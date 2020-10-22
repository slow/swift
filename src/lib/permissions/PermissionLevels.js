const { Collection } = require('discord.js');

const empty = Symbol('empty');

class PermissionLevels extends Collection {
   constructor(levels = 11) {
      super();

      for (let i = 0; i < levels; i++) super.set(i, empty);
   }

   add(level, check, options = {}) {
      return this.set(level, { check, break: Boolean(options.break), fetch: Boolean(options.fetch) });
   }

   remove(level) {
      return this.set(level, empty);
   }

   set(level, obj) {
      if (level < 0) throw new Error(`Cannot set permission level ${level}. Permission levels start at 0.`);
      if (level > this.size - 1) throw new Error(`Cannot set permission level ${level}. Permission levels stop at ${this.size - 1}.`);
      return super.set(level, obj);
   }

   isValid() {
      return this.every(
         (level) =>
            level === empty ||
            (typeof level === 'object' && typeof level.break === 'boolean' && typeof level.fetch === 'boolean' && typeof level.check === 'function')
      );
   }

   debug() {
      const errors = [];
      for (const [index, level] of this) {
         if (level === empty) continue;
         if (typeof level !== 'object') errors.push(`Permission level ${index} must be an object`);
         if (typeof level.break !== 'boolean') errors.push(`"break" in permission level ${index} must be a boolean`);
         if (typeof level.fetch !== 'boolean') errors.push(`"fetch" in permission level ${index} must be a boolean`);
         if (typeof level.check !== 'function') errors.push(`"check" in permission level ${index} must be a function`);
      }
      return errors.join('\n');
   }

   async run(message, min) {
      for (let i = min; i < this.size; i++) {
         const level = this.get(i);
         if (level === empty) continue;
         if (level.fetch && !message.member && message.guild) await message.guild.members.fetch(message.author);
         const res = await level.check(message);
         if (res) return { broke: false, permission: true };
         if (level.break) return { broke: true, permission: false };
      }
      return { broke: false, permission: false };
   }

   static get [Symbol.species]() {
      return Collection;
   }
}

module.exports = PermissionLevels;
