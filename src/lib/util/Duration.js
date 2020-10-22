const tokens = new Map([
   ['nanosecond', 1 / 1e6],
   ['nanoseconds', 1 / 1e6],
   ['ns', 1 / 1e6],

   ['millisecond', 1],
   ['milliseconds', 1],
   ['ms', 1],

   ['second', 1000],
   ['seconds', 1000],
   ['sec', 1000],
   ['secs', 1000],
   ['s', 1000],

   ['minute', 1000 * 60],
   ['minutes', 1000 * 60],
   ['min', 1000 * 60],
   ['mins', 1000 * 60],
   ['m', 1000 * 60],

   ['hour', 1000 * 60 * 60],
   ['hours', 1000 * 60 * 60],
   ['hr', 1000 * 60 * 60],
   ['hrs', 1000 * 60 * 60],
   ['h', 1000 * 60 * 60],

   ['day', 1000 * 60 * 60 * 24],
   ['days', 1000 * 60 * 60 * 24],
   ['d', 1000 * 60 * 60 * 24],

   ['week', 1000 * 60 * 60 * 24 * 7],
   ['weeks', 1000 * 60 * 60 * 24 * 7],
   ['wk', 1000 * 60 * 60 * 24 * 7],
   ['wks', 1000 * 60 * 60 * 24 * 7],
   ['w', 1000 * 60 * 60 * 24 * 7],

   ['month', 1000 * 60 * 60 * 24 * (365.25 / 12)],
   ['months', 1000 * 60 * 60 * 24 * (365.25 / 12)],
   ['b', 1000 * 60 * 60 * 24 * (365.25 / 12)],

   ['year', 1000 * 60 * 60 * 24 * 365.25],
   ['years', 1000 * 60 * 60 * 24 * 365.25],
   ['yr', 1000 * 60 * 60 * 24 * 365.25],
   ['yrs', 1000 * 60 * 60 * 24 * 365.25],
   ['y', 1000 * 60 * 60 * 24 * 365.25]
]);

class Duration {
   constructor(pattern) {
      this.offset = this.constructor._parse(pattern.toLowerCase());
   }

   get fromNow() {
      return this.dateFrom(new Date());
   }

   dateFrom(date) {
      return new Date(date.getTime() + this.offset);
   }

   static _parse(pattern) {
      let result = 0;

      pattern
         .replace(this.commas, '')
         .replace(this.aan, '1')
         .replace(this.regex, (match, i, units) => {
            units = tokens.get(units) || 0;
            result += Number(i) * units;
            return '';
         });

      return result;
   }

   static toNow(earlier, showIn) {
      if (!(earlier instanceof Date)) earlier = new Date(earlier);
      const returnString = showIn ? 'in ' : '';
      let duration = Math.abs((Date.now() - earlier) / 1000);

      if (duration < 1) return `${returnString}1 second`;
      else if (duration < 45) return `${returnString + Math.round(duration)} seconds`;
      else if (duration < 90) return `${returnString}1 minute`;

      duration /= 60;
      if (duration < 45) return `${returnString + Math.round(duration)} minutes`;
      else if (duration < 90) return `${returnString}1 hour`;

      duration /= 60;
      if (duration < 22) return `${returnString + Math.round(duration)} hours`;
      else if (duration < 36) return `${returnString}1 day`;

      duration /= 24;
      if (duration < 26) return `${returnString + Math.round(duration)} days`;
      else if (duration < 46) return `${returnString}1 month`;
      else if (duration < 320) return `${returnString + Math.round(duration / 30)} months`;
      else if (duration < 548) return `${returnString}1 year`;

      return `${returnString + Math.round(duration / 365)} years`;
   }
}

module.exports = Duration;

Duration.regex = /(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*)/gi;

Duration.commas = /,/g;

Duration.aan = /\ban?\b/gi;
