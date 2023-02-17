module.exports = {
  BasicCrawlerOptions: require('./basic-crawler-options'),
  ...require('./browser-crawler-options'),
  ...require('./http-crawler-options'),
};
