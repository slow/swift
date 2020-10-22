class GatewayStorage {
   constructor(client, type, schema, provider) {
      Object.defineProperty(this, 'client', { value: client });

      Object.defineProperty(this, 'type', { value: type });

      Object.defineProperty(this, 'providerName', { value: provider || this.client.options.providers.default });

      this.schema = schema;

      this.ready = false;
   }

   get provider() {
      return this.client.providers.get(this.providerName) || null;
   }

   get defaults() {
      return { ...this.schema.defaults, default: true };
   }

   getPath(key = '', { avoidUnconfigurable = false, piece: requestPiece = true, errors = true } = {}) {
      if (key === '' || key === '.') return { piece: this.schema, route: [] };
      const route = key.split('.');
      const piece = this.schema.get(route);

      if (!piece) {
         if (!errors) return null;
         throw `The key ${key} does not exist in the schema.`;
      }

      if (requestPiece === null) requestPiece = piece.type !== 'Folder';

      if (requestPiece) {
         if (piece.type !== 'Folder') {
            if (avoidUnconfigurable && !piece.configurable) {
               if (!errors) return null;
               throw `The key ${piece.path} is not configurable.`;
            }
            return { piece, route };
         }

         if (!errors) return null;
         const keys = avoidUnconfigurable ? piece.configurableKeys : [...piece.keys()];
         throw keys.length ? `Please, choose one of the following keys: '${keys.join("', '")}'` : 'This group is not configurable.';
      }

      if (piece.type !== 'Folder') {
         route.pop();
         return { piece: piece.parent, route };
      }

      return { piece, route };
   }

   async init() {
      if (this.ready) throw new Error(`[INIT] ${this} has already initialized.`);

      const { provider } = this;
      if (!provider) throw new Error(`This provider (${this.providerName}) does not exist in your system.`);
      this.ready = true;

      const errors = [];
      for (const piece of this.schema.values(true)) {
         piece.client = this.client;

         Object.freeze(piece);

         try {
            piece.isValid();
         } catch (error) {
            errors.push(error.message);
         }
      }

      if (errors.length) throw new Error(`[SCHEMA] There is an error with your schema.\n${errors.join('\n')}`);

      const hasTable = await provider.hasTable(this.type);
      if (!hasTable) await provider.createTable(this.type);

      const columns = await provider.getColumns(this.type);
      if (columns.length) {
         const promises = [];
         for (const [key, piece] of this.schema.paths) if (!columns.includes(key)) promises.push(provider.addColumn(this.type, piece));
         await Promise.all(promises);
      }
   }

   toJSON() {
      return {
         type: this.type,
         options: { provider: this.providerName },
         schema: this.schema.toJSON()
      };
   }

   toString() {
      return `Gateway(${this.type})`;
   }
}

module.exports = GatewayStorage;
