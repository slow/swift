const Tag = require('./Tag');
const TextPrompt = require('./TextPrompt');

const open = ['[', '(', '<'];
const close = [']', ')', '>'];
const space = [' ', '\n'];

class Usage {
   constructor(client, usageString, usageDelim) {
      Object.defineProperty(this, 'client', { value: client });

      this.deliminatedUsage = usageString !== '' ? ` ${usageString.split(' ').join(usageDelim)}` : '';

      this.usageString = usageString;

      this.usageDelim = usageDelim;

      this.parsedUsage = this.constructor.parseUsage(this.usageString);

      this.customResolvers = {};
   }

   createCustomResolver(type, resolver) {
      this.customResolvers[type] = resolver;
      return this;
   }

   customizeResponse(name, response) {
      this.parsedUsage.some((tag) => tag.register(name, response));
      return this;
   }

   createPrompt(message, options = {}) {
      return new TextPrompt(message, this, options);
   }

   toJSON() {
      return this.parsedUsage;
   }

   toString() {
      return this.deliminatedUsage;
   }

   static parseUsage(usageString) {
      const usage = {
         tags: [],
         opened: 0,
         current: '',
         openRegex: false,
         openReq: false,
         last: false,
         char: 0,
         from: 0,
         at: '',
         fromTo: ''
      };

      for (const [i, char] of Object.entries(usageString)) {
         usage.char = i + 1;
         usage.from = usage.char - usage.current.length;
         usage.at = `at char #${usage.char} '${char}'`;
         usage.fromTo = `from char #${usage.from} to #${usage.char} '${usage.current}'`;

         if (usage.last && char !== ' ') throw `${usage.at}: there can't be anything else after the repeat tag.`;

         if (char === '/' && usage.current[usage.current.length - 1] !== '\\') usage.openRegex = !usage.openRegex;

         if (usage.openRegex) {
            usage.current += char;
            continue;
         }

         if (open.includes(char)) this.tagOpen(usage, char);
         else if (close.includes(char)) this.tagClose(usage, char);
         else if (space.includes(char)) this.tagSpace(usage, char);
         else usage.current += char;
      }

      if (usage.opened)
         throw `from char #${usageString.length - usage.current.length} '${usageString.substr(
            -usage.current.length - 1
         )}' to end: a tag was left open`;
      if (usage.current)
         throw `from char #${usageString.length + 1 - usage.current.length} to end '${usage.current}' a literal was found outside a tag.`;

      return usage.tags;
   }

   static tagOpen(usage, char) {
      if (usage.opened) throw `${usage.at}: you may not open a tag inside another tag.`;
      if (usage.current) throw `${usage.fromTo}: there can't be a literal outside a tag`;
      usage.opened++;
      usage.openReq = open.indexOf(char);
   }

   static tagClose(usage, char) {
      const required = close.indexOf(char);
      if (!usage.opened) throw `${usage.at}: invalid close tag found`;
      if (usage.openReq !== required) throw `${usage.at}: Invalid closure of '${open[usage.openReq]}${usage.current}' with '${close[required]}'`;
      if (!usage.current) throw `${usage.at}: empty tag found`;
      usage.opened--;
      if (usage.current === '...') {
         if (usage.openReq) throw `${usage.at}: repeat tag cannot be required`;
         if (usage.tags.length < 1) throw `${usage.fromTo}: there can't be a repeat at the beginning`;
         usage.tags[usage.tags.length - 1].repeat = true;
         usage.last = true;
      } else {
         usage.tags.push(new Tag(usage.current, usage.tags.length + 1, required));
      }
      usage.current = '';
   }

   static tagSpace(usage, char) {
      if (char === '\n') throw `${usage.at}: there can't be a line break in the usage string`;
      if (usage.opened) throw `${usage.at}: spaces aren't allowed inside a tag`;
      if (usage.current) throw `${usage.fromTo}: there can't be a literal outside a tag.`;
   }
}

module.exports = Usage;
