const BasicCrawlerOptions = require('../basic-crawler-options');

const MINIMAL_ARGS = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
];

const EXTRA_URL_PATTERNS = ['googlesyndication.com', 'adservice.google.com'];

class BrowserCrawlerOptions extends BasicCrawlerOptions {
  constructor(typeOfCrawler, options = {}) {
    super(typeOfCrawler, options);
  }

  getOptions(handlers) {
    const options = {
      ...super.getOptions(handlers),
      browserPoolOptions: {
        retireBrowserAfterPageCount: 100,
        useFingerprints: true,
        fingerprintOptions: {
          fingerprintGeneratorOptions: {
            devices: ['mobile', 'desktop'],
            locales: ['vi-VN'],
            operatingSystems: ['windows', 'macos', 'android', 'ios'],
            browsers: ['chrome', 'edge', 'firefox', 'safari'],
          },
        },
        ...(this.options?.browserPoolOptions || {}),
      },
      headless: this.options?.headless || false,
      launchContext: {
        launchOptions: {
          args: MINIMAL_ARGS,
          handleSIGINT: false,
          ignoreHTTPSErrors: true,
          useDataDir: './cache',
        },
        useChrome: false,
        useIncognitoPages: false,
        ...(this.options?.launchContext || {}),
      },
      navigationTimeoutSecs: this.options?.navigationTimeoutSecs || 60,
      persistCookiesPerSession: this.options?.persistCookiesPerSession || false,
      postNavigationHooks: [...(this.options?.postNavigationHooks || [])],
      preNavigationHooks: [
        // Hook help to authenticate proxy info
        async ({ page, proxyInfo }) => {
          if (!proxyInfo) return;
          const { username, password } = proxyInfo;
          await page.authenticate({ username, password });
        },
        // Hook help to block requests
        // async ({ blockRequests }) => {
        //   await blockRequests({
        //     extraUrlPatterns: EXTRA_URL_PATTERNS,
        //   });
        // },
        // Hook help to set header of request
        async ({ page }) => {
          await page.setExtraHTTPHeaders({
            'accept-encoding': 'gzip, deflate, br',
          });
        },
        // Hook help to change option of page before navigating url
        (_, gotoOptions) => {
          gotoOptions.waitUntil = 'domcontentloaded';
        },
        ...(this.options?.preNavigationHooks || []),
      ],
    };

    return options;
  }
}

module.exports = BrowserCrawlerOptions;
