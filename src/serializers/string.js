const { Serializer } = require('swift');

module.exports = class extends Serializer {
   deserialize(data) {
      return String(data);
   }
};
