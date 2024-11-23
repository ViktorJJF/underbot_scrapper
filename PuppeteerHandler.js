const puppeteer = require('puppeteer');

class PuppeteerHandler {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async launchPuppeteer() {
    try {
      this.browser = await puppeteer.launch({
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
}

module.exports = PuppeteerHandler;
