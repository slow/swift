const regexTypes = ['reg', 'regex', 'regexp'];

class Possible {
   constructor([, name, type = 'literal', min, max, regex, flags]) {
      this.name = name;

      this.type = type;

      this.min = min ? this.constructor.resolveLimit(min, 'min') : undefined;

      this.max = max ? this.constructor.resolveLimit(max, 'max') : undefined;

      this.regex = regexTypes.includes(this.type) && regex ? new RegExp(regex, flags) : undefined;

      if (regexTypes.includes(this.type) && !this.regex) throw 'Regex types must include a regular expression';
   }

   static resolveLimit(limit, limitType) {
      if (isNaN(limit)) throw `${limitType} must be a number`;
      return parseFloat(limit);
   }
}

module.exports = Possible;
