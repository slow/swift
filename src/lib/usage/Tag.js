const Possible = require('./Possible');

class Tag {
   constructor(members, count, required) {
      this.required = required;

      this.repeat = false;

      this.possibles = this.constructor.parseMembers(members, count);

      this.response = null;
   }

   register(name, response) {
      if (this.response) return false;
      if (this.possibles.some((val) => val.name === name)) {
         this.response = response;
         return true;
      }
      return false;
   }

   static parseMembers(members, count) {
      const literals = [];
      const types = [];
      members = this.parseTrueMembers(members);
      return members.map((member, i) => {
         const current = `${members.join('|')}: at tag #${count} at bound #${i + 1}`;
         let possible;
         try {
            possible = new Possible(this.pattern.exec(member));
         } catch (err) {
            if (typeof err === 'string') throw `${current}: ${err}`;
            throw `${current}: invalid syntax, non specific`;
         }
         if (possible.type === 'literal') {
            if (literals.includes(possible.name)) throw `${current}: there can't be two literals with the same text.`;
            literals.push(possible.name);
         } else if (members.length > 1) {
            if (['str', 'string'].includes(possible.type) && members.length - 1 !== i)
               throw `${current}: the String type is vague, you must specify it at the last bound`;
            if (types.includes(possible.type)) throw `${current}: there can't be two bounds with the same type (${possible.type})`;
            types.push(possible.type);
         }
         return possible;
      });
   }

   static parseTrueMembers(members) {
      const trueMembers = [];
      let regex = false;
      let current = '';
      for (const char of members) {
         if (char === '/') regex = !regex;
         if (char !== '|' || regex) {
            current += char;
         } else {
            trueMembers.push(current);
            current = '';
         }
      }
      trueMembers.push(current);
      return trueMembers;
   }
}

Tag.pattern = /^([^:]+)(?::([^{}/]+))?(?:{([^,]+)?,?([^}]+)?})?(?:\/(.+)\/(\w+)?)?$/i;

module.exports = Tag;
