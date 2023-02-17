const BasicCrawlerOptions = require('../basic-crawler-options');

const ADDITIONAL_MIME_TYPES = ['text/html', 'application/json', 'application/ld+json'];

class HttpCrawlerOptions extends BasicCrawlerOptions {
  constructor(typeOfCrawler, options = {}) {
    super(typeOfCrawler, options);
  }

  getOptions(handlers) {
    let additionalMimeTypes = new Set([...ADDITIONAL_MIME_TYPES, ...(this.options?.additionalMimeTypes || [])]);

    const options = {
      ...super.getOptions(handlers),
      additionalMimeTypes: [...additionalMimeTypes],
      ignoreSslErrors: this.options?.ignoreSslErrors || false,
      navigationTimeoutSecs: this.options?.navigationTimeoutSecs || 60,
      persistCookiesPerSession: this.options?.persistCookiesPerSession || false,
      postNavigationHooks: [...(this.options?.postNavigationHooks || [])],
      preNavigationHooks: [...(this.options?.preNavigationHooks || [])],
    };

    return options;
  }
}

module.exports = HttpCrawlerOptions;
