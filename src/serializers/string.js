const { Serializer } = require('@swift/core');

module.exports = class extends Serializer {
   deserialize(data) {
      return String(data);
   }
};
