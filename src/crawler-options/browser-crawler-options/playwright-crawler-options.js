const BrowserCrawlerOptions = require('./browser-crawler-options');

class PlaywrightCrawlerOptions extends BrowserCrawlerOptions {
  constructor(typeOfCrawler, options = {}) {
    super(typeOfCrawler, options);
  }

  getOptions(handlers) {
    const options = {
      ...super.getOptions(handlers),
    };

    return options;
  }
}

module.exports = PlaywrightCrawlerOptions;
