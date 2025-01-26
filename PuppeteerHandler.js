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
        timeout: 0,
        headless: false
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

      let resolvePromise;
      const timelineDeltaPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      newPage.on('request', (request) => {
        const url = request.url();
        if (url.includes('/match_timelinedelta')) {
          const urlObj = new URL(url);
          const matchTimeLineDeltaCredentials = {
            fullUrl: url,
            queryParams: decodeURIComponent(urlObj.searchParams.toString()),
          };

          console.log(matchTimeLineDeltaCredentials);

          this.isFetchingMatchTimelineDelta = false;
          this.matchTimeLineDeltaCredentials = matchTimeLineDeltaCredentials;
          resolvePromise(matchTimeLineDeltaCredentials);
        } else {
          request.continue();
        }
      });

      const pageUrl = `https://doradobet.com/deportes/partido/${matchId}`;
      await newPage.goto(pageUrl);
      // take screenshot
      await newPage.screenshot({ path: 'timeline.png' });
      // Wait for credentials with 10 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout waiting for match timeline delta'));
        }, 10000);
      });

      try {
        const credentials = await Promise.race([timelineDeltaPromise, timeoutPromise]);
        await newPage.screenshot({ path: 'timeline2.png' });
        await newPage.close();
        return credentials;
      } catch (error) {
        console.log('No /match_timelinedelta request found within timeout.');
        await newPage.close();
        this.isFetchingMatchTimelineDelta = false;
        return null;
      }

    } catch (error) {
      console.error('Error:', error);
      if (newPage) await newPage.close();
      this.isFetchingMatchTimelineDelta = false;
      return null;
    }
  }
}

module.exports = PuppeteerHandler;
