const { Console } = require('console');
const { inspect } = require('util');
const Colors = require('./Colors');
const Timestamp = require('./Timestamp');
const constants = require('./constants');
const { mergeDefault } = require('./util');

class SwiftConsole extends Console {
   constructor(options = {}) {
      options = mergeDefault(constants.DEFAULTS.CONSOLE, options);

      super(options.stdout, options.stderr);

      Object.defineProperty(this, 'stdout', { value: options.stdout });

      Object.defineProperty(this, 'stderr', { value: options.stderr });

      Colors.useColors = typeof options.useColor === 'undefined' ? this.stdout.isTTY || false : options.useColor;

      this.template = options.timestamps !== false ? new Timestamp(options.timestamps === true ? 'YYYY-MM-DD HH:mm:ss' : options.timestamps) : null;

      this.colors = {};

      for (const [name, formats] of Object.entries(options.colors)) {
         this.colors[name] = {};
         for (const [type, format] of Object.entries(formats)) this.colors[name][type] = new Colors(format);
      }

      this.utc = options.utc;
   }

   get timestamp() {
      return this.utc ? this.template.displayUTC() : this.template.display();
   }

   write(data, type = 'log') {
      type = type.toLowerCase();
      data = data.map(this.constructor._flatten).join('\n');
      const { time, message } = this.colors[type];
      const timestamp = this.template ? time.format(`[${this.timestamp}]`) : '';
      super[constants.DEFAULTS.CONSOLE.types[type] || 'log'](
         data
            .split('\n')
            .map((str) => `${timestamp} ${message.format(str)}`)
            .join('\n')
      );
   }

   log(...data) {
      this.write(data, 'log');
   }

   warn(...data) {
      this.write(data, 'warn');
   }

   error(...data) {
      this.write(data, 'error');
   }

   debug(...data) {
      this.write(data, 'debug');
   }

   verbose(...data) {
      this.write(data, 'verbose');
   }

   wtf(...data) {
      this.write(data, 'wtf');
   }

   static _flatten(data) {
      if (typeof data === 'undefined' || typeof data === 'number' || data === null) return String(data);
      if (typeof data === 'string') return data;
      if (typeof data === 'object') {
         const isArray = Array.isArray(data);
         if (isArray && data.every((datum) => typeof datum === 'string')) return data.join('\n');
         return data.stack || data.message || inspect(data, { depth: Number(isArray), colors: Colors.useColors });
      }
      return String(data);
   }
}

module.exports = SwiftConsole;
