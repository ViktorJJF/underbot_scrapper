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
      await page.close();
      res.send(`Hello, world!`);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
});

app.get('/screenshot', async (req, res) => {
    try {
      const {url} = req.query;
        const page = await browser.newPage();
        await page.goto(url); // Replace with your desired URL
        const screenshot = await page.screenshot();
        await page.close();
        res.contentType('image/png');
        res.send(screenshot);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/match_timeline_delta', async (req, res) => {
    try {
        const {matchId} = req.query;
        const matchTimelineDelta = await puppeteerHandler.getMatchTimelineDelta(matchId);
        console.log("matchTimelineDelta: ",matchTimelineDelta);
        res.status(200).send({ok:true, matchTimelineDeltaCredentials: matchTimelineDelta});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

const PORT=process.env.PORT || 3000;


const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });


process.on('SIGINT', async () => {
  console.log('Shutting down...');
  server.close(() => {
    stopPuppeteer().then(() => {
      process.exit(0);
    });
  });
});