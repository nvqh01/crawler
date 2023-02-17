const HttpCrawlerOptions = require('./http-crawler-options');

class JSDOMCrawlerOptions extends HttpCrawlerOptions {
  constructor(typeOfCrawler, options = {}) {
    super(typeOfCrawler, options);
  }

  getOptions(handlers) {
    const options = {
      ...super.getOptions(handlers),
      hideInternalConsole: this.options?.hideInternalConsole || false,
      runScripts: this.options?.runScripts || false,
    };

    return options;
  }
}

module.exports = JSDOMCrawlerOptions;
