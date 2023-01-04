const puppeteer = require("puppeteer");
const Queue = require("bull");
require("dotenv").config();
var axios = require("axios");

console.log("here we go!");

var mongoose = require("mongoose");
const coach = require("./models/coach");

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
  Coach: require("./models/coach")(mongoose),
  Media: require("./models/media")(mongoose)
};
var scrapSiteData = async (pageurl, sex) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    console.log("Inside the method");
    const url = pageurl;

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0,
    });
    await page.waitForSelector(
      "#cookiebot-welcome > div > div.button-wrap > a"
    );
    await page.click("#cookiebot-welcome > div > div.button-wrap > a");
    let nextpage = await page.$(
      "div.container.container--line-top > div > div > ol > li.paginator__item.paginator__item.paginator__item--next.next-page > a"
    );

    let data = [];
    do {
      await page.waitForSelector(
        "body > div.wrapper.d-flex.flex-column > div.coaches-overview > div.container.container--line-top > div > div > ol",
        {
          waitUntil: "networkidle2",
          timeout: 0,
        }
      );

      nextpage = await page.$(
        "div.container.container--line-top > div > div > ol > li.paginator__item.paginator__item.paginator__item--next.next-page > a"
      );

      let AllProducts = await page.$$(
        "div.paginator-results > div.container > div.row > div.card__container.col-sm-12.col-md-6.col-lg-4 > div.card.card--default "
      );

      for (let i = 0; i < AllProducts.length; i++) {
        let name = await AllProducts[i].$(
          "div.card__inner > div.card__front > div.card__content > div.card__content__inner > h4"
        );
        if (name) {
          await page.waitForTimeout(2000);
          await AllProducts[i].click();

          await page.waitForSelector(
            "body > div.wrapper.d-flex.flex-column > header > div.cf-sticky-wrapper",
            {
              waitUntil: "networkidle2",
              timeout: 0,
            }
          );
          let result = await page.evaluate(async () => {
            let slugArray = window.location.href.split("/");
            let slug = slugArray[slugArray.length - 2];
            let name = await document.querySelector(
              "body > div.wrapper.d-flex.flex-column > header > div.cf-sticky-wrapper > div > div > div > div.header-content-wrapper > div.header-content-title-wrapper > h1"
            );
            name = name ? name.innerText : "";
            let subtitle = document.querySelector(
              "body > div.wrapper.d-flex.flex-column > header > div.cf-sticky-wrapper > div > div > div > div.header-content-wrapper > div.header-content-job"
            );
            subtitle = subtitle ? subtitle.innerText : "";
            let feautreArray = [];
            await document
              .querySelectorAll(
                "#main > div > div.container > div > div.col-lg-8.col-md-12.content > div > div.coach-profile-tab-content-container > div.coach-profile-tab-content.coach-profile-tab-content-about.active > div.profile-section.profile-section-about > div.profile-section-about-show-more-section.show-more-section > div.profile-section-about-features > ul > li"
              )
              .forEach((feature) => {
                feautreArray.push(feature ? feature.innerText : "");
              });
            let topicArray = [];
            await document
              .querySelectorAll(
                "#main > div > div.container > div > div.col-lg-8.col-md-12.content > div > div.coach-profile-tab-content-container > div.coach-profile-tab-content.coach-profile-tab-content-about.active > div.profile-section.profile-section-about > div.profile-section-about-topics > div.feature-tags > ul > li"
              )
              .forEach((top) => {
                topicArray.push(top ? top.innerText : "");
              });

            let experience = document.querySelector(
              "#main > div > div.container > div > div.col-lg-4.col-md-12.sidebar > div.sidebar-general > div.sidebar-experience > div"
            );
            experience = experience ? experience.innerText.trim() : "";
            let costs = "";
            await document
              .querySelectorAll(
                "#main > div > div.container > div > div.col-lg-4.col-md-12.sidebar > div.sidebar-bottom > div > div > p"
              )
              .forEach((cost) => {
                costs += cost ? cost.innerText : "";
              });
            let education = [];
            await document
              .querySelectorAll(
                "#main > div > div.container > div > div.col-lg-8.col-md-12.content > div > div.coach-profile-tab-content-container > div.coach-profile-tab-content.coach-profile-tab-content-about.active > div.profile-section.profile-section-opleidingen > div.profile-section-institutes > ul >li"
              )
              .forEach((edu) => {
                let name = edu.querySelector(
                  "div.profile-section-institutes-training-desc"
                )
                  ? edu.querySelector(
                      "div.profile-section-institutes-training-desc"
                    ).innerText
                  : "";

                let training = edu.querySelector(
                  "div.profile-section-institutes-training-content > span.profile-section-institutes-training-name"
                );
                training = training ? training.innerText : "";
                let year = edu.querySelector(
                  "div.profile-section-institutes-training-content > span.profile-section-institutes-training-year"
                );
                year = year ? year.innerText : "";
                let content = [];
                content.push({ name: training, year });
                education.push({ desc: name, content });
              });

            let certificates = [];
            await document
              .querySelectorAll(
                "#main > div > div.container > div > div.col-lg-8.col-md-12.content > div > div.coach-profile-tab-content-container > div.coach-profile-tab-content.coach-profile-tab-content-about.active > div.profile-section.profile-section-opleidingen > div.profile-section-certificates > ul >li"
              )
              .forEach((certi) => {
                let name = certi.querySelector(
                  "div.profile-section-institutes-training-desc"
                )
                  ? certi.querySelector(
                      "div.profile-section-institutes-training-desc"
                    ).innerText
                  : "";

                let training = certi.querySelector(
                  "div.profile-section-certificates-item-content > span.profile-section-certificates-item-name"
                );
                training = training ? training.innerText : "";
                let year = certi.querySelector(
                  "div.profile-section-certificates-item-content > span.profile-section-certificates-item-year"
                );
                year = year ? year.innerText : "";
                let content = [];
                content.push({ name: training, year });
                certificates.push({ desc: name, content });
              });
            let website = document.querySelector(
              "#main > div > div.container > div > div.col-lg-8.col-md-12.content > div > div.coach-profile-tab-content-container > div.coach-profile-tab-content.coach-profile-tab-content-about.active > div.profile-section.profile-section-more-info > div.profile-section-more-info-website > div > a"
            );
            website = website ? website.href : "";
            let profile = document.querySelector(
              "body > div.wrapper.d-flex.flex-column > header > div.cf-sticky-wrapper > div > div > div > div.header-content-photo > a > img"
            )
              ? document.querySelector(
                  "body > div.wrapper.d-flex.flex-column > header > div.cf-sticky-wrapper > div > div > div > div.header-content-photo > a > img"
                ).src
              : "";

            let background = document.querySelector(
              "body > div.wrapper.d-flex.flex-column > header > div.header-banner > img"
            )
              ? document.querySelector(
                  "body > div.wrapper.d-flex.flex-column > header > div.header-banner > img"
                ).src
              : "";
            let audio = document.querySelector(
              "#main > div > div.container > div > div.col-lg-4.col-md-12.sidebar > div.sidebar-media > div.profile-section-audio > div > div > audio > source"
            )
              ? document.querySelector(
                  "#main > div > div.container > div > div.col-lg-4.col-md-12.sidebar > div.sidebar-media > div.profile-section-audio > div > div > audio > source"
                ).src
              : "";
            let video = document.querySelector(
              "#main > div > div.container > div > div.col-lg-4.col-md-12.sidebar > div.sidebar-media > div.profile-section-video > div > a"
            )
              ? document.querySelector(
                  "#main > div > div.container > div > div.col-lg-4.col-md-12.sidebar > div.sidebar-media > div.profile-section-video > div > a"
                ).href
              : "";

            return {
              slug,
              name,
              subtitle,
              features: feautreArray,
              education,
              certificates,
              website,
              background,
              profile,
              audio,
              video,
              topics: topicArray,
              costs,
              experience,
              location:[]
            };
          });
          data.push(result);
          console.log(result.name)
          
          await page.goBack({ waitUntil: "networkidle0", timeout: 0 });
        }
        AllProducts = await page.$$(
          "div.paginator-results > div.container > div.row > div.card__container.col-sm-12.col-md-6.col-lg-4 > div.card.card--default "
        );
        nextpage = await page.$(
          "div.container.container--line-top > div > div > ol > li.paginator__item.paginator__item.paginator__item--next.next-page > a"
        );
      }
      if(!nextpage){
        break;
      }
      await nextpage.click();
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 });
    } while (nextpage);

    browser.close();
    for (coach of data) {
      let ids=[]
      coach.gender = sex;
      if (coach.profile != "") {
        let image = await axios.get(coach.profile, {
          responseType: "arraybuffer",
        });
  
        let raw = Buffer.from(image.data).toString("base64");
        let base64Data =
          "data:" + image.headers["content-type"] + ";base64," + raw;
        let data = {
          base64Data,
          coachSlug: coach.slug,
          url: coach.profile,
          mime_type: "image",
        };
        let result = await models.Media.createorupdate(data);
        ids.push(result._id);
      }
      if (coach.background != "") {
        let image = await axios.get(coach.background, {
          responseType: "arraybuffer",
        });
  
        let raw = Buffer.from(image.data).toString("base64");
        let base64Data =
          "data:" + image.headers["content-type"] + ";base64," + raw;
        let data = {
          base64Data,
          url: coach.background,
          coachSlug: coach.slug,
          mime_type: "image",
        };
        let result = await models.Media.createorupdate(data);
        ids.push(result._id);
      }
  
      if (coach.video != "") {
        let data = {
          url: coach.video,
          coachSlug: coach.slug,
          mime_type: "video",
          base64Data: "",
        };
        let result = await models.Media.createorupdate(data);
        ids.push(result._id);
      }
      if (coach.audio != "") {
        let data = {
          url: coach.audio,
          mime_type: "audio",
          coachSlug: coach.slug,
          base64Data: "",
        };
        let result = await models.Media.createorupdate(data);
        ids.push(result._id);
      }
      coach.media = ids

      let res =await models.Coach.createorupdate(coach);
      console.log("data created/updated at id",res._id)
      
    }
  } catch (error) {
    console.log(error);
    browser.close();
  }
};



// // __________________________________________________________________
// //             LOGIC FOR BULL JOBS
// // __________________________________________________________________
var redisPath = process.env.REDIS_URL

// // ___________ Setting queue for Scrapping Male & Female Coaches ___________
const options = { repeat: { cron: '0 0 * * *' } }
const coachesQueue = new Queue('ScrapeCoaches', redisPath);
coachesQueue.add({element_url:"https://www.coachfinder.nl/overzicht-coaches/?gender%5B%5D=v&min-age=&max-age=",gender:"female"}, options);
coachesQueue.add({element_url:"https://www.coachfinder.nl/overzicht-coaches/?gender%5B0%5D=m&min-age=&max-age=",gender:"male"}, options);


coachesQueue.process((job) => {
  scrapSiteData(job.data.element_url, job.data.gender);
  done()
})
