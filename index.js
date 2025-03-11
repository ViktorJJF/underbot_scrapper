const express = require("express");
const puppeteer = require("puppeteer");
const PuppeteerHandler = require("./PuppeteerHandler");

let browser;
const puppeteerHandler = new PuppeteerHandler();
puppeteerHandler.launchPuppeteer().then((el) => {
  browser = puppeteerHandler.getBrowser();
  console.log("browswera: ", browser);
});

const app = express();

app.get("/", async (req, res) => {
  try {
    console.log("El brwoser: ", browser);
    const page = await browser.newPage();
    await page.close();
    res.send(`Hello, world!`);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/screenshot", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send("URL parameter is required");
    }

    const page = await browser.newPage();

    // Navigate to the URL and wait until the network is idle
    await page.goto(url, { waitUntil: "networkidle2" }); // Waits until there are no more than 2 network connections for at least 500ms
    await new Promise((resolve) => setTimeout(resolve, 7000));

    // Optionally, you can wait for a specific element or condition
    // await page.waitForSelector('selector'); // Wait for a specific element to appear

    await page.screenshot({
      path: "screenshot_endpoint.png",
    });

    await page.close();

    res.status(200).send({ ok: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/match_timeline_delta", async (req, res) => {
  try {
    const { matchId } = req.query;
    console.log("Starting search for match: ", matchId);
    const matchTimelineDelta = await puppeteerHandler.getMatchTimelineDelta(
      matchId
    );
    console.log("matchTimelineDelta: ", matchTimelineDelta);
    res
      .status(200)
      .send({ ok: true, matchTimelineDeltaCredentials: matchTimelineDelta });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 6000;

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  server.close(() => {
    stopPuppeteer().then(() => {
      process.exit(0);
    });
  });
});
