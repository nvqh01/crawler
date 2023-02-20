const {
  createBasicRouter,
  createCheerioRouter,
  createHttpRouter,
  createJSDOMRouter,
  createPlaywrightRouter,
  createPuppeteerRouter,
} = require("crawlee");

const CRAWLER_ROUTER = new Map([
  [1, createBasicRouter],
  [2, createCheerioRouter],
  [3, createHttpRouter],
  [4, createJSDOMRouter],
  [5, createPlaywrightRouter],
  [6, createPuppeteerRouter],
]);

class BasicCrawlerOptions {
  constructor(typeOfCrawler, options = {}) {
    this.typeOfCrawler = typeOfCrawler;
    this.options = options;
  }

  getOptions({ errorHandler, failedRequestHandler, requestHandler }) {
    if (!requestHandler)
      throw new Error('There is no "requestHandler" in crawler options.');

    if (errorHandler && typeof errorHandler !== "function")
      throw new Error('"errorHandler" must be a function in crawler options.');

    if (failedRequestHandler && typeof failedRequestHandler !== "function")
      throw new Error(
        '"failedRequestHandler" must be a function in crawler options.'
      );

    const options = {
      autoscaledPoolOptions: { ...(this.options?.autoscaledPoolOptions || {}) },
      keepAlive: this.options?.keepAlive || false,
      maxConcurrency: this.options?.maxConcurrency || 100,
      maxRequestRetries: this.options?.maxRequestRetries ?? 2,
      maxRequestsPerCrawl: this.options?.maxRequestsPerCrawl ?? 5_000,
      maxRequestsPerMinute: this.options?.maxRequestsPerMinute || 150,
      minConcurrency: this.options?.minConcurrency || 1,
      requestHandlerTimeoutSecs: this.options?.requestHandlerTimeoutSecs || 60,
      sessionPoolOptions: {
        blockedStatusCodes: [401, 403, 429, 500],
        maxPoolSize: 1000,
        sessionOptions: {
          maxAgeSecs: 3000,
          maxUsageCount: 50,
        },
        ...(this.options?.sessionPoolOptions || {}),
      },
      useSessionPool: this.options?.useSessionPool || false,
    };

    errorHandler && (options.errorHandler = errorHandler);

    failedRequestHandler &&
      (options.failedRequestHandler = failedRequestHandler);

    const router = CRAWLER_ROUTER.get(this.typeOfCrawler)();

    const _requestHandler = Array.isArray(requestHandler)
      ? requestHandler
      : [requestHandler];
    _requestHandler.forEach((handler) => {
      if (typeof handler === "function") router.addDefaultHandler(handler);
      else router.addHandler(handler.label, handler.handler);
    });
    options.requestHandler = router;

    return options;
  }
}

module.exports = BasicCrawlerOptions;
