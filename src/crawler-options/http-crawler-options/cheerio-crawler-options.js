const HttpCrawlerOptions = require('./http-crawler-options');

class CheerioCrawlerOptions extends HttpCrawlerOptions {
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

module.exports = CheerioCrawlerOptions;
