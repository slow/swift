const { isObject, mergeDefault } = require('./util');
const {
   DEFAULTS: { QUERYBUILDER }
} = require('./constants');

class QueryBuilder {
   constructor(options = {}) {
      const datatypes = { ...QUERYBUILDER.datatypes };
      const queryBuilderOptions = {};

      for (const [key, value] of Object.entries(options)) {
         if (key in QUERYBUILDER.queryBuilderOptions) {
            queryBuilderOptions[key] = value;
         } else {
            const obj = isObject(value) ? value : { type: value };
            datatypes[key] = key in datatypes ? mergeDefault(datatypes[key], obj) : obj;
         }
      }

      const { array, resolver, arrayResolver, formatDatatype } = mergeDefault(QUERYBUILDER.queryBuilderOptions, queryBuilderOptions);

      for (const [key, value] of Object.entries(datatypes)) {
         datatypes[key] = mergeDefault(value, mergeDefault({ array, resolver }, datatypes[key]));
      }

      Object.defineProperty(this, '_datatypes', { value: Object.seal(datatypes) });

      this.arrayResolver = arrayResolver;

      this.formatDatatype = formatDatatype;
   }

   get(type) {
      return this._datatypes[type] || null;
   }

   parse(schemaPiece) {
      const datatype = this.get(schemaPiece.type);
      const parsedDefault = this.parseValue(schemaPiece.default, schemaPiece, datatype);
      const type = typeof datatype.type === 'function' ? datatype.type(schemaPiece) : datatype.type;
      const parsedDatatype = schemaPiece.array ? datatype.array(type) : type;
      return this.formatDatatype(schemaPiece.path, parsedDatatype, parsedDefault);
   }

   parseValue(value, schemaPiece, datatype = this.get(schemaPiece.type)) {
      if (!datatype) throw new Error(`The type '${schemaPiece.type}' is unavailable, please set its definition in the constructor.`);
      if (schemaPiece.array && !datatype.array) throw new Error(`The datatype '${datatype.type}' does not support arrays.`);

      if (value === null) return null;

      return schemaPiece.array
         ? this.arrayResolver(value, schemaPiece, datatype.resolver || (() => value))
         : typeof datatype.resolver === 'function'
         ? datatype.resolver(value, schemaPiece)
         : value;
   }
}

module.exports = QueryBuilder;
