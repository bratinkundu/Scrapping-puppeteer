const puppeteer = require('puppeteer');
const Queue = require('bull');
const getReviewsData = require('./functions/getReviewsData');
const getProductData = require('./functions/getProductData');
const getProviderData = require('./functions/getProviderData');
const getQuestionURLs = require('./functions/getQuestionURLs');
const getQAData = require('./functions/getQAData');
const getAllProviderUrls = require('./functions/getAllProviderUrls');
const getThemesData = require('./functions/getThemesData');
require('dotenv').config()

var mongoose = require('mongoose');
console.log("Calling mongoose connect...")
var dbPath = process.env.MONGO_URL_PROD
mongoose.connect(dbPath, function (err) {
    if (err) {
        console.log('Unable to connect to mongo instance %s', dbPath, err);
        throw err;
    } else {
        console.log('Connected to Mongo instance %s', dbPath);
    }
});

var models = {
    Product: require('./models/Product')(mongoose),
    Provider: require('./models/Provider')(mongoose),
    Review: require('./models/Review')(mongoose),
    StartDate: require('./models/StartDate')(mongoose),
    ProviderUrls: require('./models/ProviderUrl')(mongoose),
    QuestionAnswer: require('./models/QuestionAnswer')(mongoose),
    Media: require('./models/Media')(mongoose),
    Themes: require('./models/Themes')(mongoose)
}

console.log("here we go!")
var scrapSiteData = async (models, pageurl) => {
    const startDate = new Date();
    try {
        const browser = await puppeteer.launch(
            {
                headless: true,
                args: [
                    '--start-maximized',
                ],
                defaultViewport: {
                    width: 1327,
                    height: 820
                }
            });
        const page = await browser.newPage();
        console.log("Inside the scrapSiteData method")

        const url = pageurl;
        console.log(url);

        await page.goto(url, {
            waitUntil: 'networkidle2',
        });

        // ___________________scrap reviews___________________
        var startDateReviews = new Date();
        const reviews = await getReviewsData(page);
        console.log("Scraped all reviews");
        // console.log("reviews: ", reviews);

        var reviewIds = []
        for (const review of reviews) {
            const result = await models.Review.createorupdate(review)
            reviewIds.push(result._id)
            // console.log("Review created or updated");
        }
        console.log("Stored all reviews");
        var endDateReviews = new Date();
        var timeTakenReviews = (endDateReviews - startDateReviews) / 1000;
        console.log("Time taken to scrap reviews: ", timeTakenReviews);


        // ____________________scrap provider data____________________
        var startDateProvider = new Date();
        await page.goto(url, {
            waitUntil: 'networkidle2',
        });
        const provider = await getProviderData(page);
        console.log('Fetched the provider data');
        console.log("provider: ", provider);

        provider.reviews = reviewIds;
        // console.log("provider.media: ", provider.media);
        const providerMediaIds = [];
        const mediaCollection = provider.media;
        for (const media of mediaCollection) {
            const result = await models.Media.createorupdate(media)
            // console.log(result);
            providerMediaIds.push(result._id)
        }

        provider.media = providerMediaIds;
        const result = await models.Provider.createorupdate(provider)
        console.log("Provider created or updated");

        var endDateProvider = new Date();
        var timeTakenProvider = (endDateProvider - startDateProvider) / 1000;
        console.log("Time taken to scrap provider: ", timeTakenProvider);


        // ____________________Scrap the product data____________________
        var startDateProduct = new Date();
        await page.goto(url, {
            waitUntil: 'networkidle2',
        });
        const products = await getProductData(page, provider.products);
        console.log('Fetched the product data');
        for (const product of products) {
            var reviewIds = []
            for (const review of product.reviews) {
                const result = await models.Review.createorupdate(review)
                reviewIds.push(result._id)
                // console.log("review created or updated");
            }
            product.reviews = reviewIds
            var eventIds = []
            for (const event of product.eventData) {
                const result = await models.StartDate.createorupdate(event)
                eventIds.push(result._id)
                // console.log("event created or updated");
            }
            product.startDates = eventIds
            delete product.eventData
            var productMediasIds = []
            for (const media of product.media) {
                const result = await models.Media.createorupdate(media)
                productMediasIds.push(result._id)
            }
            product.media = productMediasIds
            const result = await models.Product.createorupdate(product)
            // console.log("product created or updated");
        }
        console.log("Stored all products")
        var endDateProduct = new Date();
        var timeTakenProduct = (endDateProduct - startDateProduct) / 1000;
        console.log("Time taken to scrap product: ", timeTakenProduct);
        // console.log("product: ", product);

        browser.close();
        const endDate = new Date();
        const timeTaken = (endDate - startDate) / 1000;
        console.log("Time taken by whole program: ", timeTaken);

    } catch (error) {
        throw Error(error)
    }
}
// __________________________________________________________________
var redisPath = process.env.REDIS_URL_PROD

// ___________ Setting queue for Provider Urls ___________
const options = { repeat: { cron: '0 0 * * *' } }
const providerUrlQueue = new Queue('ScrapeURLs', redisPath);
providerUrlQueue.add('ScrapProvidersData', options);

// ___________ Setting queue for Proider Data ___________
const providersQueue = new Queue('ScrapeProvidersQueue', redisPath);

// ___________ Setting queue for QA ___________
const scrapeQADataQueue = new Queue('ScrapeQADataQueue', redisPath);
scrapeQADataQueue.add('ScrapQAData', options);

// ___________ Setting queue for themes ___________
const scrapeThemesQueue = new Queue('ScrapeThemesQueue', redisPath);
scrapeThemesQueue.add('ScrapThemesData', options);


// ___________ Method for running Provider jobs ___________
const scrapeAllProviders = (urls) => {
    for (const urlElement of urls) {
        providersQueue.add({url: urlElement.url});
    }
    providersQueue.process((job) => {
        const url = job.data.url;
        scrapSiteData(models, url);
    })
}

// ___________________ scrap Provider URLs  ___________________
providerUrlQueue.process('ScrapProvidersData', async (job, done) => {

    let urls = await getAllProviderUrls();
    console.log("urlsCount: ", urls.length);
    urls.forEach(async (element) => {
        try {
            await models.ProviderUrls.createorupdate(element)
        } catch (error) {
            console.log("Error in adding url::", error)
        }

    })

    scrapeAllProviders(urls);
})

// _________________ Scarp QA data _________________
scrapeQADataQueue.process('ScrapQAData', async (job, done) => {

    // ____________________Scrap the questions URLs____________________
    var startDateQuestions = new Date();
    const questionURLS = await getQuestionURLs();
    var endDateQuestions = new Date();
    var timeTakenQuestions = (endDateQuestions - startDateQuestions) / 1000;
    console.log("Time taken to scrap questions: ", timeTakenQuestions);
    console.log('Fetched the question urls');
    // console.log("questionURLS: ", questionURLS);

    // ____________________Scarp the question-answers data____________________
    var startDateQA = new Date();
    const questionAnswers = await getQAData(questionURLS);
    console.log('Fetched the question-answers data');
    // console.log("questionAnswers: ", questionAnswers);
    for (const qa of questionAnswers) {
        const result = await models.QuestionAnswer.createorupdate(qa)
    }
    console.log("Stored all the QAData")
    var endDateQA = new Date();
    var timeTakenQA = (endDateQA - startDateQA) / 1000;
    console.log("Time taken to scrap QA: ", timeTakenQA);

    // ___________________________________________________________________________

})

// _________________ Scarp QA data _________________
scrapeThemesQueue.process('ScrapThemesData', async (job, done) => {
    // ___________________ scrap themes ___________________
    getThemesData().then(async (allThemes) => {
        for (const theme of allThemes) {
            var themeMediaIds = [];
            for (const media of theme.media) {
                const result = await models.Media.createorupdate(media)
                themeMediaIds.push(result._id)
            }
            theme.media = themeMediaIds;
            const output = await models.Themes.createorupdate(theme)
        }
        console.log("themes fetched and stored!!!")

    }).catch((err) => { console.log(err) })

})