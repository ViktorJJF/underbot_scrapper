const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class PuppeteerHandler {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isFetchingMatchTimelineDelta = false;
    this.matchTimeLineDeltaCredentials = null;
  }

  async launchPuppeteer() {
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      console.log('Puppeteer browser launched successfully.');
      this.page = await this.browser.newPage();
    } catch (error) {
      console.error('Error launching Puppeteer:', error);
      throw error; // Re-throw the error to ensure it's caught upstream
    }
  }

  async getVersion() {
    if (!this.browser) {
      console.error('Browser not initialized. Please call launchPuppeteer() first.');
      return null;
    }
    return this.browser.version();
  }

  async goToPage(url) {
    if (!this.page) {
      console.error('Page not initialized. Please call launchPuppeteer() first.');
      return;
    }
    try {
      await this.page.goto(url);
      console.log(`Navigated to ${url}`);
    } catch (error) {
      console.error(`Error navigating to ${url}:`, error);
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('Puppeteer browser closed.');
      } catch (error) {
        console.error('Error closing Puppeteer:', error);
      }
    }
  }

  getBrowser() {
    return this.browser;
  }

  // for dorado bet
  async getMatchTimelineDelta(matchId) {
    console.log("matchId: ",matchId);
    if (this.isFetchingMatchTimelineDelta) {
      console.log('Already fetching match timeline delta.');
      return;
    }

    this.isFetchingMatchTimelineDelta = true;
    let newPage = null;

    try {
      newPage = await this.browser.newPage();
      await newPage.setRequestInterception(true);

      newPage.on('request', (request) => {
        const url = request.url();
        if (url.includes('/match_timelinedelta')) {
          const urlObj = new URL(url);
          const matchTimeLineDeltaCredentials = {
            fullUrl: url,
            queryParams: decodeURIComponent(urlObj.searchParams.toString()),
          };

          console.log(matchTimeLineDeltaCredentials);

          if (!newPage.isClosed()) newPage.close();
          this.isFetchingMatchTimelineDelta = false;
          this.matchTimeLineDeltaCredentials = matchTimeLineDeltaCredentials;
        } else {
          request.continue();
        }
      });

      const pageUrl = `https://doradobet.com/deportes/partido/${matchId}`;
      await newPage.goto(pageUrl);

      setTimeout(() => {
        if (!newPage.isClosed()) {
          console.log('No /match_timelinedelta request found.');
          newPage.close();
        }
        this.isFetchingMatchTimelineDelta = false;
      }, 15000); // 15 seconds timeout

      return this.matchTimeLineDeltaCredentials;

    } catch (error) {
      if (newPage && !newPage.isClosed()) newPage.close();
      this.isFetchingMatchTimelineDelta = false;
    }
  
  }
}

module.exports = PuppeteerHandler;
