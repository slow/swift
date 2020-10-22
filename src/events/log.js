const { Event } = require('@swift/core');

module.exports = class extends Event {
   run(data) {
      this.client.console.log(data);
   }

   init() {
      if (!this.client.options.consoleEvents.log) this.disable();
   }
};
