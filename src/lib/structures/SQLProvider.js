const Provider = require('./Provider');
const { deepClone, tryParse, makeObject, isObject, objectToTuples } = require('../util/util');
const Gateway = require('../settings/Gateway');
const Type = require('../util/Type');

class SQLProvider extends Provider {
   async addColumn() {
      throw new Error(`[PROVIDERS] ${this.path} | Missing method 'addColumn' of ${this.constructor.name}`);
   }

   async removeColumn() {
      throw new Error(`[PROVIDERS] ${this.path} | Missing method 'removeColumn' of ${this.constructor.name}`);
   }

   async updateColumn() {
      throw new Error(`[PROVIDERS] ${this.path} | Missing method 'updateColumn' of ${this.constructor.name}`);
   }

   async getColumns() {
      throw new Error(`[PROVIDERS] ${this.path} | Missing method 'updateColumn' of ${this.constructor.name}`);
   }

   parseUpdateInput(updated, resolve) {
      if (!updated) return [[], []];
      if (Array.isArray(updated)) {
         const keys = new Array(updated.length),
            values = new Array(updated.length);
         const [first] = updated;

         if (Array.isArray(first) && first.length === 2) for (let i = 0; i < updated.length; i++) [keys[i], values[i]] = updated[i];
         else if (first.data && first.piece) this._parseGatewayInput(updated, keys, values, resolve);
         else throw new TypeError(`Expected void, [k, v][], SettingsUpdateResult[], or an object literal. Got: ${new Type(updated)}`);

         return [keys, values];
      }
      if (!isObject(updated)) throw new TypeError(`Expected void, [k, v][], SettingsUpdateResult[], or an object literal. Got: ${new Type(updated)}`);

      return objectToTuples(updated);
   }

   parseEntry(gateway, entry) {
      if (!entry) return null;
      if (typeof gateway === 'string') gateway = this.client.gateways[gateway];
      if (!(gateway instanceof Gateway)) return entry;

      const object = { id: entry.id };
      for (const piece of gateway.schema.values(true)) {
         if (entry[piece.path]) makeObject(piece.path, this.parseValue(entry[piece.path], piece), object);
      }

      return object;
   }

   parseValue(value, schemaPiece) {
      if (typeof value === 'undefined') return deepClone(schemaPiece.default);
      if (schemaPiece.array) {
         if (value === null) return deepClone(schemaPiece.default);
         if (typeof value === 'string') value = tryParse(value);
         if (!Array.isArray(value)) throw new Error(`Could not parse ${value} to an array. Returned empty array instead.`);
      } else {
         const type = typeof value;
         switch (schemaPiece.type) {
            case 'any':
               if (type === 'string') return tryParse(value);
               break;
            case 'integer':
               if (type === 'number') return value;
               if (type === 'string') return Number(value);
               if (value instanceof Buffer) return Number(value[0]);
               break;
            case 'boolean':
               if (type === 'boolean') return value;
               if (type === 'number') return value === 1;
               if (type === 'string') return value === 'true';
               if (value instanceof Buffer) return Boolean(value[0]);
               break;
            case 'string':
               if (type === 'string') return /^\s|\s$/.test(value) ? value.trim() : value;
               return String(value);
         }
      }

      return value;
   }

   _parseGatewayInput(updated, keys, values, resolve = true) {
      if (resolve && this.qb) {
         for (let i = 0; i < updated.length; i++) {
            const entry = updated[i];
            [keys[i]] = entry.data;
            values[i] = this.qb.resolve(entry.piece, entry.data[1]);
         }
      } else {
         for (let i = 0; i < updated.length; i++) [keys[i], values[i]] = updated[i].data;
      }
   }
}

module.exports = SQLProvider;
