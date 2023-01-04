const puppeteer = require("puppeteer");
const Queue = require("bull");
require("dotenv").config();
console.log("here we go!");

var mongoose = require("mongoose");

console.log("Calling mongoose connect...");

var dbPath = process.env.MONGO_URL;

mongoose.connect(dbPath, function (err) {
  if (err) {
    console.log("Unable to connect to mongo instance %s", dbPath, err);
    throw err;
  } else {
    console.log("Connected to Mongo instance %s", dbPath);
  }
});

var models = {
  Coach: require("./models/Coach")(mongoose),
  Media: require("./models/Media")(mongoose)
};
var scrapSiteData = async (pageurl) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    console.log("Inside the method");

    const url = pageurl;

    await page.goto(url, {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector("#result-wrapper");

    let AllProducts = await page.$$("#result-wrapper > article ");

    let mainData = [];
    for (let i = 0; i < AllProducts.length; i++) {
      let name = await AllProducts[i].$(
        "div.coach-container > div.coach-header > div.right > div.coach-title > h3 > a"
      );
      await name.click();
      await page.waitForSelector("#custom_html-3 > div > p");
      let data = await page.evaluate(async () => {
        let slugArray = window.location.href.split("/");
        let slug = slugArray[slugArray.length - 2];
        let name = document.querySelector('#custom_html-3 > div > h1').innerText

        let location = (document.querySelector("#custom_html-3 > div > p").innerText).trim();
        let description = document.querySelector(
          "#post-4893 > div.entry-content > p:nth-child(2)"
        )
          ? document.querySelector(
              "#post-4893 > div.entry-content > p:nth-child(2)"
            ).innerText
          : "";

        let introduction = document.querySelector(
          "#custom_html-8 > div > p:nth-child(1)"
        ).innerText;

        let locationArray = [];
        document
          .querySelectorAll("#custom_html-5 > div > p > a")
          .forEach((feature) => {
            locationArray.push(feature.innerText);
          });
        let caochingArray = [];
        document
          .querySelectorAll("#custom_html-6 > div > ul > li")
          .forEach((feature) => {
            caochingArray.push(feature.querySelector("a").innerText);
          });
        let image = document.querySelector("#custom_html-3 > div > div > img").src;

        return {
          slug,
          name,
          description,
          introduction,
          location,
          locations: locationArray,
          types_coaching: caochingArray,
          image,
        };
      });
      console.log(data.name);
      mainData.push(data);
      await page.goto(url, {
        waitUntil: "networkidle2",
      });
      AllProducts = await page.$$("#result-wrapper > article");
    }

    browser.close();
    for (coach of mainData) {

      let imgObj = {
        url : coach.image,
        mime_type : "image",
        base64Data : ""  
      }

      let result = await models.Media.createorupdate(imgObj);

      coach.media = [result._id]

      let coachResult = await models.Coach.createorupdate(coach);
      console.log("Added/Updated the coach with _id:",coachResult._id)
    }

  } catch (error) {
    console.log(error);

    browser.close();
  }
};


let element_url = "https://www.coaching.nl/coaches";
scrapSiteData(element_url);
