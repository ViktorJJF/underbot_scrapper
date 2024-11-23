const express = require('express');
const puppeteer = require('puppeteer');
const PuppeteerHandler = require('./PuppeteerHandler');

let browser;
const puppeteerHandler = new PuppeteerHandler();
puppeteerHandler.launchPuppeteer().then(el=>{
    browser = puppeteerHandler.getBrowser()
    console.log("browswera: ",browser)
})

const app = express();

app.get('/', async (req, res) => {
    try {
      console.log("El brwoser: ",browser)
      const page = await browser.newPage();
      const version = await page.evaluate(() => puppeteer.version);
      await page.close();
      res.send(`Hello, world! Puppeteer version: ${version}`);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
});

app.get('/screenshot', async (req, res) => {
    try {
        const page = await browser.newPage();
        await page.goto('https://www.example.com'); // Replace with your desired URL
        const screenshot = await page.screenshot();
        await page.close();
        res.contentType('image/png');
        res.send(screenshot);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


const server = app.listen(3000, () => {
    console.log('Server listening on port 3000');
});


process.on('SIGINT', async () => {
  console.log('Shutting down...');
  server.close(() => {
    stopPuppeteer().then(() => {
      process.exit(0);
    });
  });
});