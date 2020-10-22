const { Argument } = require('@swift/core');

module.exports = class extends Argument {
   run(arg, possible, message) {
      const task = this.client.tasks.get(arg);
      if (task) return task;
      throw message.language.get('RESOLVER_INVALID_PIECE', possible.name, 'task');
   }
};
