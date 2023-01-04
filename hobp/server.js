const puppeteer = require("puppeteer");
const Queue = require("bull");
require("dotenv").config();
var axios = require("axios");

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
  Media: require("./models/Media")(mongoose),
  Trainings: require("./models/Trainings")(mongoose),
  Levels: require("./models/Levels")(mongoose),
  Themes: require("./models/Themes")(mongoose),
  Types: require("./models/Types")(mongoose),
  Providers: require("./models/Providers")(mongoose),
  Competency: require("./models/Competency")(mongoose),
};
const MAPPER = {
  "E-learning": "E-learnings",
  "Live sessie": "Live sessies",
  Audioboek: "Audioboeken",
  Samenvatting: "Samenvattingen",
  Media: "Media",
  Test: "Testen",
  Podcast: "Podcasts",
  "E-book": "E-books",
  Video: "Video's",
  Leerlijn: "Leerlijnen",
};
var scrapSiteData = async (pageurl) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    console.log("Inside the method");

    let url = pageurl;

    await page.goto(url, {
      waitUntil: "networkidle2",

      timeout: 0,
    });
    await page.waitForSelector("#filters");

    // await getThemes(page);
    // await getTypes(page);
    // await getProvider(page);
    // await getCompetency(page);
    // await getLevel(page);

    await getTrainings(page);

    browser.close();
  } catch (error) {
    console.log(error);
  }
};

const getThemes = async (page) => {
  let themes = [];
  const themesArray = await page.$$(
    "#filter-options-theme > div.pt-4 > div.form-check.form-switch"
  );
  console.log(themesArray.length);
  for (let i = 0; i < themesArray.length; i++) {
    console.log(`theme-${i}`)
    let inputSelector = await themesArray[i].$(`#theme-${i}`);
    await Promise.all([
      await page.evaluate(async (i) => {
        document.querySelector(`#theme-${i}`).click()
      },i),
      await page.waitForFunction('document.querySelector("#page > div > div > div.fade").style.display == "block"',{timeout:0})
  
    ])

    // await page.evaluate(async (i) => {
    //   document.querySelector(`#theme-${i}`).click()
    // },i);
    // await page.waitForSelector('#page > div > div > div.fade.show > hr',{timeout:0});

  //  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 
    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "load", timeout: 0 }),
    // ]);
    await page.waitForSelector(
      "#page > div.container.mt-9.mb-12.flex > div.flex-grow.relative > div.fade.show > div.flex > div.bg-white > h1"
    );
    let result = await page.evaluate(async () => {
      let name = document.querySelector(
        "#page > div.container.mt-9.mb-12.flex > div.flex-grow.relative > div.fade.show > div.flex > div.bg-white > h1"
      ).innerText;

      let description = document.querySelector(
        "#page > div > div > div.fade.show > div.flex > div.bg-white > p:nth-child(3)"
      );
      description = description ? description.innerText : "";

      let logo = document.querySelector(
        "#page > div > div > div.fade.show > div.flex > div.relative > img"
      );

      logo = logo ? logo.src : "";

      let url = window.location.href;
      let splited_url = url.split('/'); 
      let slug = '/'+splited_url[splited_url.length-2]+'/'+splited_url[splited_url.length-1]
      return {
        name,
        description,
        logo,
        url,
        slug
      };
    });

    themes.push(result);
    // inputSelector.click();
    // await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 });
    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);

    await Promise.all([
      await page.evaluate(async (i) => {
        document.querySelector(`#theme-${i}`).click()
      },i),
      await page.waitForFunction('document.querySelector("#page > div > div > div.fade").style.display == "none"',{timeout:0})
  
    ])

    // await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

  }
  for (theme of themes) {
    if (theme.logo != "") {
      let image = await axios.get(theme.logo, {
        responseType: "arraybuffer",
      });
      let slug = theme.logo.replace('https://hobp.nl','')
      console.log(slug)
      let raw = Buffer.from(image.data).toString("base64");
      let base64Data =
        "data:" + image.headers["content-type"] + ";base64," + raw;
      let data = {
        base64Data,
        url: theme.logo,
        mime_type: "image",
        mediaType:"logo",
        slug
      };
      let result = await models.Media.createorupdate(data);
      theme.logo = [result._id];
    }

    let themeResult = await models.Themes.createorupdate(theme);
    console.log("Added/Updated the Theme with _id:", themeResult._id);
  }

};

const getTypes = async (page) => {
  let type = [];
  const openTypes = await page.$(
    "#filters > div > div > div > form > div.pt-3 > div:nth-child(2) > a"
  );
  await openTypes.click();
  const typesArray = await page.$$(
    "#filter-options-type > div.pt-4 > div.form-check.form-switch"
  );

  for (let i = 0; i < typesArray.length; i++) {
    console.log(`type-${i}`)
    let name = await typesArray[i].$eval(
      "label > span > span.label",
      (element) => element.innerText
    );
    let description = "";

    // let name = await page.$('label > span > span.label');

    let inputSelector = await typesArray[i].$(`#type-${i}`);
    await page.evaluate(async (i) => {
      document.querySelector(`#type-${i}`).click()
    },i);

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);

    let url = await page.url();
    let splited_url = url.split('/'); 
    let slug = '/'+splited_url[splited_url.length-2]+'/'+splited_url[splited_url.length-1]
    type.push({
      name,
      description,
      url,
      slug
    });
    await page.evaluate(async (i) => {
      document.querySelector(`#type-${i}`).click()
    },i);

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);
  }
  for (type_data of type) {
    let typeResult = await models.Types.createorupdate(type_data);
    console.log("Added/Updated the type with _id:", typeResult._id);
  }
};

const getProvider = async (page) => {
  const openProvider = await page.$(
    "#filters > div > div > div > form > div.pt-3 > div:nth-child(3) > a"
  );
  await openProvider.click();
  let provider = [];
  const supplierArray = await page.$$(
    "#filter-options-supplier > div.pt-4 > div.form-check.form-switch"
  );

  for (let i = 0; i < supplierArray.length; i++) {
    let name = await supplierArray[i].$eval(
      "label > span > span.label",
      (element) => element.innerText
    );
    console.log(`#supplier-${i}`)
    let description = "";
    let inputSelector = await supplierArray[i].$(`#supplier-${i}`);
    await page.evaluate(async (i) => {
      document.querySelector(`#supplier-${i}`).click()
    },i);

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);

    let url = await page.url();

    let splited_url = url.split('/'); 
    let slug = '/'+splited_url[splited_url.length-2]+'/'+splited_url[splited_url.length-1]
    provider.push({
      name,
      slug,
      description,
      url,
    });
    await page.evaluate(async (i) => {
      document.querySelector(`#supplier-${i}`).click()
    },i);

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);
  }
  for (provider_data of provider) {
    let providerResult = await models.Providers.createorupdate(provider_data);
    console.log("Added/Updated the provider with _id:", providerResult._id);
  }
};

const getLevel = async (page) => {
  const openlevel = await page.$(
    "#filters > div > div > div > form > div.pt-3 > div:nth-child(4) > a"
  );
  await openlevel.click();

  let level = [];
  const levelArray = await page.$$(
    "#filter-options-level > div.pt-4 > div.form-check.form-switch"
  );

  console.log(levelArray.length);
  for (let i = 0; i < levelArray.length; i++) {
    console.log(`level-${i}`);
    let name = await levelArray[i].$eval(
      "label > span > span.label",
      (element) => element.innerText
    );
    let description = "";
    let index = i;
    
    let inputSelector = await levelArray[i].$(`#level-${i}`);
    await page.evaluate(async (index) => {
      document.querySelector(`#level-${index}`).click()
    },index);

    // let click = await inputSelector.click();
    // console.log("click",click)
    await page.waitForSelector('#page > div > div > div.fade.show > hr',{timeout:0});
    console.log("after click")


    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);
    let url = await page.url();

    let splited_url = url.split('/'); 
    let slug = '/'+splited_url[splited_url.length-2]+'/'+splited_url[splited_url.length-1]
    level.push({
      name,
      description,
      url,
      slug
    });
    await page.evaluate(async (i) => {
      document.querySelector(`#level-${i}`).click()
    },i);

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);
  }
  console.log("level length", level.length);
  for (level_data of level) {
    let levelResult = await models.Levels.createorupdate(level_data);
    console.log("Added/Updated the level with _id:", levelResult._id);
  }
};

const getCompetency = async (page) => {
  const openCompentency = await page.$(
    "#filters > div > div > div > form > div.pt-3 > div:nth-child(5) > a"
  );
  await openCompentency.click();
  let competency = [];
  const skillArray = await page.$$(
    "#filter-options-skill > div.pt-4 > div.form-check.form-switch"
  );

  console.log(skillArray.length);
  for (let i = 0; i < skillArray.length; i++) {
    console.log(i);
    console.log(`competency-${i}`);
    let name = await skillArray[i].$eval(
      "label > span > span.label",
      (element) => element.innerText
    );
    let description = "";

    let inputSelector = await skillArray[i].$(`#skill-${i}`);
    await page.evaluate(async (i) => {
      document.querySelector(`#skill-${i}`).click()
    },i);

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);

    let url = await page.url();

    let splited_url = url.split('/'); 
    let slug = '/'+splited_url[splited_url.length-2]+'/'+splited_url[splited_url.length-1]
    competency.push({
      name,
      description,
      url,
      slug
    });
    await page.evaluate(async (i) => {
      document.querySelector(`#skill-${i}`).click()
    },i);

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }) 

    // await Promise.all([
    //   inputSelector.click(),
    //   page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 }),
    // ]);
  }
  console.log("competency length", competency.length);
  for (competency_data of competency) {
    let competencyResult = await models.Competency.createorupdate(
      competency_data
    );
    console.log("Added/Updated the competency with _id:", competencyResult._id);
  }
};
const getTrainings = async (page) => {
  let nextpage;
  let data = [];
  do {
    nextpage = await page.$(
      "#page > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > nav > ul > li:nth-child(3) > a"
    );
    // console.log(nextpage)
    let all_trainings = await page.$$(
      "#page > div > div > div:nth-child(2) > div:nth-child(2) > div > article "
    );
    console.log("all", all_trainings.length);

    for (let i = 0; i < all_trainings.length; i++) {
      await page.waitForTimeout(2000);
      console.log("training - ", i);

      let type = await all_trainings[i].$eval(
        "div > ul > li",
        (element) => element.innerText
      );
      await Promise.all([all_trainings[i].click(), page.waitForNavigation()]);
      await page.waitForSelector(
        "body > div:nth-child(2) > div > div > section.section > div > div:nth-child(2) > aside > div.padding.border-box.border > h2",
        { waitUntil: "networkidle2", timeout: 0 }
      );
      let result = await page.evaluate(async () => {
        let slugArray = window.location.href.split("/");
        // let slug = slugArray[slugArray.length - 1];
        let slug = window.location.href.replace('https://hobp.nl','')
        let name = await document.querySelector(
          "body > div:nth-child(2) > div > div > section.section > div > div:nth-child(2) > aside > div.padding.border-box.border > h2"
        );
        name = name ? name.innerText : "";

        let subject = document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.padding.border-box.border.border--medium-gray > table > tbody > tr:nth-child(1) > td:nth-child(2)"
        );
        subject = subject ? subject.innerText : "";
        let description = document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > div > div:nth-child(4) > p:nth-child(2)"
        );
        description = description ? description.innerText : "";
        let duration = document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.padding.border-box.border.border--medium-gray > table > tbody > tr:nth-child(2) > td:nth-child(2)"
        );
        duration = duration ? duration.innerText : "";
        let ratings = document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.padding.border-box.border.border--medium-gray > table > tbody > tr:nth-child(7) > td:nth-child(2)"
        );
        ratings = ratings ? ratings.innerText : "";
        let certificates = document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.padding.border-box.border.border--medium-gray > table > tbody > tr:nth-child(5) > td:nth-child(2)"
        );
        certificates = certificates ? certificates.innerText : "";
        let level = document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.padding.border-box.border.border--medium-gray > table > tbody > tr:nth-child(6) > td:nth-child(2)"
        );
        level = level ? level.innerText : "";
        let background = document.querySelector(
          "body > div:nth-child(2) > div > div > section.hero.height--large > img"
        );

        background = background ? background.src : "";
        let provider = ""
        let providerArray = document.querySelectorAll("table.margin-vertical > tbody > tr")

        providerArray.forEach((el) => {
          if(el.querySelector('td').innerText === 'Aanbieder:'){
            provider = el.querySelectorAll('td')[1] ? el.querySelectorAll('td')[1].innerText : "" 
          }
        })

        let date = await document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.padding.border-box.border.border--medium-gray > div > ul:nth-child(1) > li > div.text--strike"
        );
        date = date ? date.innerText : "";
        let time = await document.querySelector(
          "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.padding.border-box.border.border--medium-gray > div > ul:nth-child(2)"
        );
        time = time ? time.innerText : "";
        let timeFrom = time !== "" ? time.split(" ")[1] : "";
        let timeTill = time !== "" ? time.split(" ")[3] : "";

        let reviewArray = [];
        await document
          .querySelectorAll(
            "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.reviews.padding.md--no-padding.margin-top--none.margin-top__md--medium > ul > li"
          )
          .forEach((review) => {
            let name = review.querySelector(
              "div.reviews__item-head > div.reviews__item-meta > span.reviews__item-name"
            );
            name = name ? name.innerText : "";
            let stars = review.querySelectorAll(
              "div.reviews__item-head > div.reviews__item-rating > span.fa.fa-star.is-active"
            );

            stars = stars ? stars.length : "";
            let date = review.querySelector(
              "div.reviews__item-head > div.reviews__item-meta > date"
            );
            date = date ? date.innerText : "";
            let data = {
              name,
              stars,
              date,
            };
            reviewArray.push(data);
          });

        await document
          .querySelectorAll(
            "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > aside > div.reviews.padding.md--no-padding.margin-top--none.margin-top__md--medium > div.collapse > ul > li"
          )
          .forEach((review) => {
            let name = review.querySelector(
              "div.reviews__item-head > div.reviews__item-meta > span.reviews__item-name"
            );
            name = name ? name.innerText : "";

            let message = review.querySelector(
              "div.reviews__item-head > div.reviews__item-body > p"
            );
            message = message ? message.innerText : "";

            let stars = review.querySelectorAll(
              "div.reviews__item-head > div.reviews__item-rating > span.fa.fa-star.is-active"
            );
            stars = stars ? stars.length : "";
            let date = review.querySelector(
              "div.reviews__item-head > div.reviews__item-meta > date"
            );
            date = date ? date.innerText : "";
            let data = {
              name,
              stars,
              date,
            };
            reviewArray.push(data);
          });
        let competenciesArray = [];
        await document
          .querySelectorAll(
            "body > div:nth-child(2) > div > div > section.section.padding-vertical--medium > div > div:nth-child(2) > div > div.margin-top--medium > div > div.tags__item"
          )
          .forEach((competency) => {
            let name = competency.querySelector("span.tags__item-label");
            name = name ? name.innerText : "";
            competenciesArray.push(name);
          });

        return {
          title: name,
          slug,
          subject,
          date,
          timeFrom,
          timeTill,
          description,
          duration,
          certificates,
          ratings,
          level,
          reviews: reviewArray,
          competenciesArray,
          levelCode: level,
          provider,
          background,
        };
      });
      result.type = type;

      data.push(result);
      console.log(result);

      await page.goBack({ waitUntil: "networkidle0", timeout: 0 });

      all_trainings = await page.$$(
        "#page > div > div > div:nth-child(2) > div:nth-child(2) > div > article"
      );
      nextpage = await page.$(
        "#page > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > nav > ul > li:nth-child(3) > a"
      );
    }
    if (!nextpage) {
      break;
    }
    await nextpage.click();
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 });
  } while (nextpage);

  for (training of data) {
    console.log("legtgh", data.length);
    if (training.background != "") {
      let slug = training.background.replace('https://hobp.nl','')
      console.log(slug)

      let image = await axios.get(training.background, {
        responseType: "arraybuffer",
      });

      let raw = Buffer.from(image.data).toString("base64");
      let base64Data =
        "data:" + image.headers["content-type"] + ";base64," + raw;
      let data = {
        base64Data,
        url: training.background,
        mime_type: "image",
        mediaType:"background",
        slug,
      };
      let result = await models.Media.createorupdate(data);
      training.media = [result._id];
    }

    if (training.type != "") {
      console.log(training.type);
      console.log(MAPPER[training.type]);
      let result = await models.Types.getType(MAPPER[training.type]);
      training.typeId = result ? result.data.slug : null;
    }

    training.providerId = training.provider
    

    let trainingResult = await models.Trainings.createorupdate(training);
    console.log("Added/Updated the training with _id:", trainingResult._id);
  }
};

let element_url = "https://hobp.nl/online-leren/ontdekken";
scrapSiteData(element_url);
