const {
  BasicCrawler,
  CheerioCrawler,
  HttpCrawler,
  JSDOMCrawler,
  PlaywrightCrawler,
  PuppeteerCrawler,
  Request,
  RequestQueue,
  ProxyConfiguration,
  Log,
  LogLevel,
} = require("crawlee");

const {
  BasicCrawlerOptions,
  CheerioCrawlerOptions,
  HttpCrawlerOptions,
  JSDOMCrawlerOptions,
  PlaywrightCrawlerOptions,
  PuppeteerCrawlerOptions,
} = require("./crawler-options");

const CRAWLERS = new Map([
  [1, BasicCrawler],
  [2, CheerioCrawler],
  [3, HttpCrawler],
  [4, JSDOMCrawler],
  [5, PlaywrightCrawler],
  [6, PuppeteerCrawler],
]);

const CRAWLER_OPTIONS = new Map([
  [1, BasicCrawlerOptions],
  [2, CheerioCrawlerOptions],
  [3, HttpCrawlerOptions],
  [4, JSDOMCrawlerOptions],
  [5, PlaywrightCrawlerOptions],
  [6, PuppeteerCrawlerOptions],
]);

const TIME_TO_WAIT_FOR_RESTARTING_CRAWLER = 90_000;
const TIME_TO_WAIT_FOR_CHANGING_PROXIES = 5_000;

class Crawler {
  static BASIC_CRAWLER = 1;
  static CHEERIO_CRAWLER = 2;
  static HTTP_CRAWLER = 3;
  static JSDOM_CRAWLER = 4;
  static PLAYWRIGHT_CRAWLER = 5;
  static PUPPETEER_CRAWLER = 6;

  constructor(
    typeOfCrawler,
    {
      setUpProxies: { proxies = [], swapProxies = false } = {},
      crawlerOptions = {},
    } = {}
  ) {
    this.typeOfCrawler = typeOfCrawler;
    this.formatProxies(proxies);
    this.swapProxies = swapProxies;
    this.options = crawlerOptions;
    this.log = new Log({ prefix: "Crawler Service" });
    this.numberOfChangingProxies = 0;
    this.requestsInProcess = [];
    setInterval(
      () => this.maybeChangeProxies(),
      TIME_TO_WAIT_FOR_CHANGING_PROXIES
    );
    process.stdin.resume();
    process.on("SIGINT", () => {
      this.release().then(() => {
        this.log.info("Stop crawler successfully.");
        return process.exit(0);
      });
    });
  }

  addRequests(requests) {
    if (!this.isRequestQueueInitialized())
      return setTimeout(() => this.addRequests(requests), 2_000);
    this.requestQueue.addRequests(this.convertRequests(requests)).then();
  }

  convertRequests(requests) {
    return Array.isArray(requests) ? requests : [requests];
  }

  changeNewProxies(proxies = []) {
    if (!proxies.length) {
      this.log.warning("New proxies is empty.");
      return;
    }

    this.restart("Ready to change new proxies for crawler.");
    this.formatProxies(proxies);
    this.release();
  }

  static createRequest({
    url,
    uniqueKey = null,
    userData = {},
    label = null,
    noRetry = false,
    skipNavigation = false,
  }) {
    const request = {
      url,
      uniqueKey,
      userData,
      label,
      noRetry,
      skipNavigation,
    };
    !uniqueKey && delete request.uniqueKey;
    !label && delete request.label;
    return new Request(request);
  }

  formatProxies(proxies) {
    if (!proxies.length) {
      this.proxies = [];
      return;
    }

    if (this.typeOfCrawler === Crawler.BASIC_CRAWLER) {
      this.log.warning("Basic crawler can not use proxy configuration.");
      this.proxies = [];
      return;
    }

    this.proxies = proxies.map((proxy) => {
      const protocol = "http";
      const [hostname, port, username, password] = proxy.split(":");
      return `${protocol}://${username}:${password}@${hostname}:${port}`;
    });

    this.shuffleProxies();
  }

  getProxies() {
    if (!this.proxies.length) {
      this.log.warning(
        "Can not get proxies because there are not any proxies in crawler."
      );
      return [];
    }

    if (this.proxies.length <= 1) return this.proxies;

    const proxies = this.proxies.filter((_, index) => {
      if (this.numberOfChangingProxies % 2 === 0) return index % 2 === 0;
      else return index % 2 !== 0;
    });
    ++this.numberOfChangingProxies;

    return proxies;
  }

  async initialize(handlers) {
    if (!this.crawlerOptions) {
      const CrawlerOptions = CRAWLER_OPTIONS.get(this.typeOfCrawler);
      this.crawlerOptions = new CrawlerOptions(
        this.typeOfCrawler,
        this.options
      );
    }

    !this?.requestQueue && (this.requestQueue = await RequestQueue.open());
    this.requestsInProcess.length &&
      this.addRequests(
        this.requestsInProcess.splice(0, this.requestsInProcess.length)
      );
    const options = {
      ...this.crawlerOptions.getOptions(handlers),
      requestQueue: this.requestQueue,
    };

    const proxyUrls = this.swapProxies ? this.getProxies() : this.proxies;
    if (proxyUrls.length) {
      let maxPoolSize;
      let maxUsageCount;
      let retireBrowserAfterPageCount;

      if (proxyUrls.length < this.proxies.length) {
        maxPoolSize = proxyUrls.length * 1;
        maxUsageCount = 5;
        retireBrowserAfterPageCount =
          maxUsageCount * 4 < 100 ? maxUsageCount * 4 : 100;
      } else {
        maxPoolSize = 1000;
        maxUsageCount = 50;
        retireBrowserAfterPageCount = 100;
      }

      options?.browserPoolOptions &&
        (options.browserPoolOptions = {
          ...options.browserPoolOptions,
          retireBrowserAfterPageCount,
        });

      options.persistCookiesPerSession = true;
      options.proxyConfiguration = new ProxyConfiguration({ proxyUrls });
      options.sessionPoolOptions = {
        ...options.sessionPoolOptions,
        maxPoolSize,
        sessionOptions: {
          maxAgeSecs: 3000,
          maxUsageCount,
        },
      };
      options.useSessionPool = true;

      this.maxHandledRequests = maxPoolSize * maxUsageCount;
    }

    const _Crawler = CRAWLERS.get(this.typeOfCrawler);
    this.crawler = new _Crawler(options);
    this?.crawler &&
      (this.crawler.stats.log.setLevel(LogLevel.OFF),
      (this.crawler.log = this.log));
  }

  isRequestQueueInitialized() {
    if (this?.requestQueue) return true;
    this.log.error("RequestQueue is not initialized.");
    return false;
  }

  isCrawlerInitialized() {
    if (this?.crawler) return true;
    this.log.error("Crawler is not initialized.");
    return false;
  }

  isWaitingToRestart() {
    return this._isWaitingToRestart;
  }

  maybeChangeProxies() {
    if (!this.proxies.length) return;

    if (!this?.crawler || this?.requestQueue) return;

    const numberOfHandledRequests =
      this.crawler.requestQueue.assumedHandledCount;
    if (
      this.crawler?.requestQueue &&
      numberOfHandledRequests >= this.maxHandledRequests
    )
      this.restart("Reach max handled request in crawler.");

    const numberOfSessions =
      this.crawler.sessionPool.getState().sessions.length;
    if (
      this.crawler?.sessionPool &&
      numberOfSessions > 0 &&
      this.crawler.sessionPool.usableSessionsCount <= 0
    )
      this.restart("Maybe change proxies for crawler.");
  }

  async release() {
    this?.crawler && (await this.crawler.teardown());
    if (this.requestQueue.inProgress.size) {
      for (const id of this.requestQueue.inProgress) {
        const request = await this.requestQueue.getRequest(id);
        this.requestsInProcess.push(request);
      }
    }
    this?.requestQueue && (await this.requestQueue.drop().catch());
    this.crawler = undefined;
    this.requestQueue = undefined;
    this._isWaitingToRestart = false;
  }

  restart(message = "Unknown") {
    if (this._isWaitingToRestart) return; // Just restart crawler once times
    this._isWaitingToRestart = true;
    this.log.error("Crawler is restarted because of: " + message);
    this.log.info(
      `Crawler will be restarted in ${
        TIME_TO_WAIT_FOR_RESTARTING_CRAWLER / 1000
      } second(s).`
    );
    setTimeout(() => this.start(), TIME_TO_WAIT_FOR_RESTARTING_CRAWLER);
  }

  shuffleProxies() {
    this.proxies.sort(() => Math.random() - 0.5);
  }

  start(handlers, requests = []) {
    if (this.isWaitingToRestart())
      return setTimeout(() => {
        this.log.info(
          `Waiting for crawler to finishing restarting in ${
            TIME_TO_WAIT_FOR_RESTARTING_CRAWLER / 2
          } second(s).`
        ),
          this.start();
      }, TIME_TO_WAIT_FOR_RESTARTING_CRAWLER / 2);

    this.initialize(handlers)
      .then(async () => {
        this.isCrawlerInitialized() &&
          this.crawler
            .run(this.convertRequests(requests))
            .catch((err) => this.restart(err))
            .finally(() => this.release());
      })
      .catch((err) => this.restart(err.stack));
  }
}

module.exports = Crawler;
