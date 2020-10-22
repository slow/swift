const { isFunction, isNumber } = require('../../util/util');

class SchemaPiece {
   constructor(parent, key, type, options = {}) {
      Object.defineProperty(this, 'client', { value: null, writable: true });

      Object.defineProperty(this, 'parent', { value: parent });

      Object.defineProperty(this, 'key', { value: key });

      Object.defineProperty(this, 'path', { value: `${this.parent.path ? `${this.parent.path}.` : ''}${this.key}` });

      this.type = type.toLowerCase();

      this.array = 'array' in options ? options.array : Array.isArray(options.default);

      this.default = 'default' in options ? options.default : this._generateDefault();

      this.min = 'min' in options ? options.min : null;

      this.max = 'max' in options ? options.max : null;

      this.configurable = 'configurable' in options ? options.configurable : this.type !== 'any';

      this.filter = 'filter' in options ? options.filter : null;
   }

   get serializer() {
      return this.client.serializers.get(this.type);
   }

   edit(options = {}) {
      if ('type' in options) this.type = options.type;
      if ('array' in options) this.array = options.array;
      if ('configurable' in options) this.configurable = options.configurable;
      if ('filter' in options) this.filter = options.filter;
      if ('default' in options) this.default = options.default;
      if ('min' in options || 'max' in options) {
         const { min = null, max = null } = options;
         this.min = min;
         this.max = max;
      }

      return this;
   }

   isValid() {
      if (typeof this.type !== 'string') throw new TypeError(`[KEY] ${this.path} - Parameter type must be a string.`);
      if (!this.client.serializers.has(this.type)) throw new TypeError(`[KEY] ${this.path} - ${this.type} is not a valid type.`);

      if (typeof this.array !== 'boolean') throw new TypeError(`[KEY] ${this.path} - Parameter array must be a boolean.`);

      if (typeof this.configurable !== 'boolean') throw new TypeError(`[KEY] ${this.path} - Parameter configurable must be a boolean.`);

      if (this.min !== null && !isNumber(this.min)) throw new TypeError(`[KEY] ${this.path} - Parameter min must be a number or null.`);
      if (this.max !== null && !isNumber(this.max)) throw new TypeError(`[KEY] ${this.path} - Parameter max must be a number or null.`);
      if (this.min !== null && this.max !== null && this.min > this.max)
         throw new TypeError(`[KEY] ${this.path} - Parameter min must contain a value lower than the parameter max.`);

      if (this.filter !== null && !isFunction(this.filter)) throw new TypeError(`[KEY] ${this.path} - Parameter filter must be a function`);

      if (this.array) {
         if (!Array.isArray(this.default)) throw new TypeError(`[DEFAULT] ${this.path} - Default key must be an array if the key stores an array.`);
      } else if (this.default !== null) {
         if (['boolean', 'string'].includes(this.type) && typeof this.default !== this.type)
            throw new TypeError(`[DEFAULT] ${this.path} - Default key must be a ${this.type}.`);
      }

      return true;
   }

   async parse(value, guild) {
      const language = guild ? guild.language : this.client.languages.default;
      const val = await this.serializer.deserialize(value, this, language, guild);
      if (this.filter && this.filter(this.client, val, this, language)) throw language.get('SETTING_GATEWAY_INVALID_FILTERED_VALUE', this, value);
      return val;
   }

   _generateDefault() {
      if (this.array) return [];
      if (this.type === 'boolean') return false;
      return null;
   }

   toJSON() {
      return {
         array: this.array,
         configurable: this.configurable,
         default: this.default,
         max: this.max,
         min: this.min,
         type: this.type
      };
   }
}

module.exports = SchemaPiece;
