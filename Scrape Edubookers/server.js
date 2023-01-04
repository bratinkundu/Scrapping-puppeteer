const puppeteer = require('puppeteer');
const Queue = require('bull');
const axios = require('axios').default
require('dotenv').config()

console.log("here we go!")
var months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

var mongoose = require('mongoose');

console.log("Calling mongoose connect...")

var dbPath = process.env.MONGO_URL

mongoose.connect(dbPath, function (err) {
  if (err) {
    console.log('Unable to connect to mongo instance %s', dbPath, err);
    throw err;
  } else {
    console.log('Connected to Mongo instance %s', dbPath);
  }
});

var models = {
    Product : require('./models/Product')(mongoose),
    Provider : require('./models/Provider')(mongoose),
    Review : require('./models/Review')(mongoose),
    StartDate : require('./models/StartDate')(mongoose),
    ProviderUrls : require('./models/ProviderUrl')(mongoose),
    Media : require('./models/Media')(mongoose)
}




var scrapSiteData = async (models, pageurl) =>  {
    try {
        
        console.log("Scrapping data for Url:",pageurl)
        
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        console.log("Inside the method")

        const url = pageurl;

        await page.goto(url, {
            waitUntil: 'networkidle2',
        });


        console.log("Scrapping the reviews..")
        const reviews = await getReviewsData(page);

        if(reviews.length > 0){
            
            // Add Reviews to DB
            for (review of reviews){
                const result = await models.Review.createorupdate(review)
                console.log("Added/Updated review with id:", result._id)
            }
        }

        // Scrap the provider data
        console.log("Scrapping the Providers..")
        const provider = await getProviderData(page);
        console.log("Provider",provider.providerData)
        console.log("AllMedia Provider", provider.allMedia)
        console.log("Product Links", provider.pLinks)

        // Adding Provider data to DB
        const providerResult = await models.Provider.createorupdate(provider.providerData)
        console.log("Added/Updated provider with Id:", providerResult._id)

        if(provider.allMedia.length > 0){
            // Adding Medias to the DB
            for(media of provider.allMedia){
                const result = await models.Media.createorupdate(media)
                console.log("Added/Updated the Medias for provider with Id:", result._id)
            }
        }
        

        
        if(provider.providerData.products.length > 0){

            // Scrap the product data
            console.log("Scrapping the Products and StartDates..")
            const product = await getProductData(page, provider.pLinks);

            console.log("Products",product.products)
            console.log("StartDates",product.productStartDates)
            console.log("allMedia Products", product.allMedia)
    
            for (eproduct of product.products){
                const result = await models.Product.createorupdate(eproduct)
                console.log("Added/Updated the Product with Id:", result._id)
            }
    
            if(product.productStartDates.length > 0){

                // Adding the StartDates to DB
                for (estartdates of product.productStartDates){
                    if(estartdates.length > 0){
                        for(_startdate of estartdates){
                            const result = await models.StartDate.createorupdate(_startdate);
                            console.log("Added/Updated the StartDates with Id:", result._id)
                        }
                    }
                }
            }

            if(product.allMedia.length > 0){
                // Adding Medias to the DB
                for(media of product.allMedia){
                    const result = await models.Media.createorupdate(media)
                    console.log("Added/Updated the Product Media with Id:",result._id)
    
                }
            }
            
        }
        console.log("Scrapping completed for Url:",pageurl)


        browser.close();
        
    } catch (error) {
            console.log(error)
        }
}


var getProviderData = async (page) => {
    var providerData = await page.evaluate(async () => {

        var slugArray = window.location.href.split('/')
        
        var slug = slugArray[slugArray.length - 1];
        var name = document.querySelector('h1.Course-detail__heading').innerText.trim();
        var addressLine = document.querySelector('p.Course-detail__address').innerText.trim();
        var providerScore = ""
        var tags = []
        var tagElement = document.querySelectorAll('div.Course-detail__features > ul')[0].querySelectorAll('li')
        if(tagElement){
            tagElement.forEach(el => {
                var tag = {
                    icon: el.querySelector('div.Tag__icon > i').classList[1],
                    text: el.querySelector('div.Tag > span').innerText
                }
                //var tag = el.querySelector('span.Tag__text').innerText.trim();
                tags.push(tag);
            })
        }
        
        var themes = [] 
        var themeElement = document.querySelectorAll('div.Course-detail__features > ul')[1].querySelectorAll('li > a')
        if(themeElement){
            themeElement.forEach(el => {
                let themeSlugArray = el.href.split('/');
                var theme = '/' +themeSlugArray[themeSlugArray.length - 1];
                themes.push(theme);
            })
        }
        
        var logo = document.querySelector('div.Course-detail__cta-box.Course-detail__logo > img').src ? document.querySelector('div.Course-detail__cta-box.Course-detail__logo > img').src : ""
        var description = document.querySelector('div.Course-detail__body').textContent ? document.querySelector('div.Course-detail__body').textContent : ""
        var media = []
        var mediaElements = document.querySelectorAll('div.AdvancedSlider__slide.AdvancedSlider__slide > a')
        if(mediaElements.length > 0){
            for (const el of mediaElements) {
                if(el.href){
                    media.push(el.href)
                }
            }
        }
        var trainers = []
        
        var trainerElement = document.querySelectorAll('div.Trainer-circle__fullname')
        if(trainerElement){
            trainerElement.forEach(el => {
                trainers.push(el.innerText.split("\n")[0])
            })
        }
        
        var reviewScore = document.querySelector('div.ReviewSummary__score') ? document.querySelector('div.ReviewSummary__score').childNodes[0].textContent.replace(',','.').trim() : ""
        var moreReviewButton = document.querySelector('div.container.Course-detail__review-container > button.Read-more')
        if(moreReviewButton){
            await moreReviewButton.click()
        }
        var Allreviews = document.querySelectorAll('div.Review > header.Review__header > time.Review__date') ? document.querySelectorAll('div.Review > header.Review__header > time.Review__date') : [];
        var reviews = []
        var months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
        Allreviews.forEach((el) => {
            var dateString = el.innerText;
            var dtArray = dateString.split(' ')
            var dtMonth = months.indexOf(dtArray[1]) + 1;
            var date = new Date(dtMonth+','+dtArray[0]+','+dtArray[2]);
            date = date.toISOString().split("T")[0];

            reviews.push(date);
        })

        // Need to get array of reviews & convert to ISO

        var provider = {
            slug : slug,
            name : name,
            addressLine : addressLine,
            providerScore : providerScore,
            tags : tags,
            themes : themes,
            logo : logo,
            description : description,
            media : media,
            trainers : trainers,
            products : [],
            reviewScore : reviewScore,
            reviews : reviews  
        }

        console.log("provider collection",provider);
        return provider;
    })
    var pslugArray = await page.url().split('/');
    var pslug = pslugArray[pslugArray.length - 1];
    providerData.slug = pslug;

    var allMedia = []

    for (const mediaObj of providerData.media) {
        try {
            var mediaType = mediaObj.split('.').pop().toLowerCase()
            if (mediaType === "jpg" || mediaType === "jpeg" || mediaType === "png" || mediaType === "gif"){
                mediaType = `image/${mediaType}`
                let img = await axios.get(mediaObj, { responseType: 'arraybuffer' });
                let base64Data = Buffer.from(img.data).toString('base64');

                allMedia.push({
                    url : mediaObj,
                    base64Data : base64Data,
                    mimeType: mediaType
                })
            } 
        } catch (error) {
            console.log(error);
        }
    }
    // after click on Bekijk alle trainingen and scrap the products list array
    // Check if moreButton is present or not
    var moreProductButton = await page.$('div.Training-institute__courses.Training-institute__courses--center > a');
    var allProducts = {}
    if(moreProductButton){
        moreProductButton.click();
        await page.waitForSelector('#Category-list__results')
        //While loop here for clicking more products button
        var AllProducts = await page.evaluate(()=>{
            var products = []
            document.querySelectorAll('#Category-list__results > article').forEach(el => {
                let productSlugArray = querySelector('a.Course__name').href.split('/')
                products.push('/'+productSlugArray[productSlugArray.length - 1])
            })
    
            return products;
        })
        
        providerData.products = AllProducts;
    }
    else{
        // Check if the provider has products or not
        // Yes? Then get the data from Tiles in the page
        allProducts = await page.evaluate(() => {
            let products = []
            let productLinks = []
            let productList = document.querySelectorAll('div.Training-institute__course')
            productList.forEach((p) => {
                products.push(p.querySelector('div.Training-institute__course--title > a').innerText)
                productLinks.push(p.querySelector('div.Training-institute__course--title > a').href)
            })
            return {products, productLinks};
        })

        providerData.products = allProducts.products;
    }
    
    let pLinks = allProducts.productLinks
    //console.log("providerData",providerData)
    return {providerData, allMedia, pLinks};
}

var getReviewsData = async (page) => {

    var reviews = await page.evaluate( async () => {
        var allreviews = [];
        let check = true;
        while(check){
            var moreReviewButton = document.querySelector('div.container.Course-detail__review-container > button.Read-more')
            if(moreReviewButton){
                await moreReviewButton.click();
                await new Promise(function(resolve) {
                    setTimeout(resolve, 2000)
                }); 
            }
            if(moreReviewButton == null || moreReviewButton.style.display == 'none'){
                console.log("Called check as false")
                check = false;
            }
        }

        // var moreReviewButton = document.querySelector('div.container.Course-detail__review-container > button.Read-more')
        //     if(moreReviewButton){
        //         await moreReviewButton.click();
        //         await new Promise(function(resolve) {
        //             setTimeout(resolve, 2000)
        //         }); 
        //     }
        
        var AllReviews = document.querySelectorAll('div.Review') ? document.querySelectorAll('div.Review') : [];
        console.log(AllReviews)
        AllReviews.forEach((element) => {
            var slugArray = window.location.href.split('/')
            var slug = slugArray[slugArray.length - 1]

            // convert date
            var months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
            var dateString = element.querySelector('header > time').innerText;
            var dtArray = dateString.split(' ')
            var dtMonth = months.indexOf(dtArray[1]) + 1;
            var date = new Date(dtMonth+','+dtArray[0]+','+dtArray[2]);
            date = date.toISOString().split("T")[0];

            var review = {
                providerSlug : slug,
                productSlug : "",
                date : date,
                text : element.querySelector('div.container.Review__text') ? element.querySelector('div.container.Review__text').innerText : "",
                trainingScore : element.querySelectorAll('footer > div.Review-scores > div.Review-scores__item') ? element.querySelectorAll('footer > div.Review-scores > div.Review-scores__item')[0].innerText :"",
                trainerScore : element.querySelectorAll('footer > div.Review-scores > div.Review-scores__item') ? element.querySelectorAll('footer > div.Review-scores > div.Review-scores__item')[1].innerText : "",
                recommendation : element.querySelector('header.Review__header > span > i').className.split(' ')[1] == 'fa-thumbs-up' ? true : false, 
                name : element.querySelector('footer > div.Review-author > div.Review-author__info > div.Review-author__name') ? element.querySelector('footer > div.Review-author > div.Review-author__info > div.Review-author__name').innerText : "",
                functions : element.querySelector('footer > div.Review-author > div.Review-author__info > div.Review-author__company') ? element.querySelector('footer > div.Review-author > div.Review-author__info > div.Review-author__company').innerText : ""
            }
            
            allreviews.push(review)
        })
        return allreviews;
    })

    console.log(reviews)
    return reviews;
}

var getProductData = async (page, productLinks) => {

    var AllProducts = []
    productLinks = productLinks == undefined ? [] : productLinks
    if(productLinks.length > 0){
        AllProducts = productLinks
    }
    else{
        await page.waitForSelector('#Category-list__results')
        AllProducts = await page.$$('#Category-list__results > article > div.container > div.Course__body > a:nth-child(3)')    
    }
    
    var products = [];
    var productStartDates = [];
    var allMedia = []

    for (let i = 0; i < AllProducts.length; i++){

        await page.waitForTimeout(2000)
        if(productLinks.length > 0){
            page.goto(AllProducts[i])
        }
        else{
            await AllProducts[i].click();
            console.log("Button click")
        }
        

        try{
            await page.waitForSelector('h1.Course-detail__heading') 
        }
        catch(e){
            console.log("Bad URL. Calling continue")
            await page.goBack({ waitUntil: "networkidle0" });
            AllProducts = await page.$$('#Category-list__results > article > div.container > div.Course__body > a:nth-child(3)')
            continue;
        }
        

        var pslugArray = await page.url().split('/');
        var pslug = pslugArray[pslugArray.length - 2] + '/' +pslugArray[pslugArray.length - 1] ;

        var productData = await page.evaluate(async ()=>{

            var product = {
                slug : "",
                name : document.querySelector('h1.Course-detail__heading') ? document.querySelector('h1.Course-detail__heading').innerText : "",
                tags : [],
                description : document.querySelector('div.Course-detail__description') ? document.querySelector('div.Course-detail__description').innerText : "",
                themes : [],
                images : [],
                price : document.querySelector('div.Course-price > div.Course-price--no-vat') ? document.querySelector('div.Course-price > div.Course-price--no-vat').innerText.trim().match(/\d/g).join("") : "",
                originalPrice : document.querySelector('div.Course-price > s') ? document.querySelector('div.Course-price > s').textContent.trim().split(' ')[1] : document.querySelector('div.Course-price > div.Course-price--no-vat').innerText.trim().match(/\d/g).join(""),
                discountPercentage : document.querySelector('div.Course-price > div.Course-price--discount') ? document.querySelector('div.Course-price > div.Course-price--discount').innerText.slice(1,-1) : 0,
                start_dates : []
            }
            console.log("Got all products")
            // Getting all the media for product
            var allImages = document.querySelectorAll('div.AdvancedSlider__list > div.AdvancedSlider__track > div.AdvancedSlider__slide')
            allImages = allImages ? allImages : [] 
            var imagearray = []
            if(allImages.length > 0){
                allImages.forEach((el) => {
                    imagearray.push(el.querySelector('a').href);
                })
            } 
            product.images = imagearray;
            console.log("Got all images")

            // Getting all the themes for product
            var allThemes = document.querySelectorAll('#Breadcrumbs > ul > li > a.button') ? document.querySelectorAll('#Breadcrumbs > ul > li > a.button') :[] 
            var themearray = []
            allThemes.forEach((el) => {
                let themeSlugArray = el.href.split('/')
                themearray.push('/'+themeSlugArray[themeSlugArray.length - 1])
            })
            product.themes = themearray;
            console.log("Got all themes")


            // Getting all the tags for product
            var allTags = document.querySelectorAll('div.Course-detail__features > ul > li') ? document.querySelectorAll('div.Course-detail__features > ul > li') : []
            var tagsarray = [];
            allTags.forEach((el) => {
                var tag = {
                    icon: el.querySelector('div.Tag__icon > i').classList[1],
                    text: el.querySelector('div.Tag > span').innerText
                }
                tagsarray.push(tag);
            })
            product.tags = tagsarray;
            console.log("Got all tags")


            // Getting all the start-dates for product
            var allStartDates = document.querySelectorAll('div.Course-calendar__info > div.Course-calendar__body > section > header') ? document.querySelectorAll('div.Course-calendar__info > div.Course-calendar__body > section > header') :[]
            var datearray = []
            var months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
            allStartDates.forEach((el) => {
                var dateString = el.querySelector('div.Date').innerText.slice(3).trim();
                var dtArray = dateString.split(' ')
                if(months.indexOf(dtArray[1]) == -1){
                    var date = dateString
                }
                else{
                    var dtMonth = (months.indexOf(dtArray[1])) + 1;
                    console.log(dtMonth+','+dtArray[0]+','+dtArray[2])
                    date = dtArray[2]+'-'+dtMonth+'-'+dtArray[0]
                    //var date = new Date(dtMonth+','+tempDate+','+dtArray[2]);
                    console.log(date)
                    //date = date.toISOString().split("T")[0];
                }
                

                var location = el.querySelector('div.Location') ? el.querySelector('div.Location').innerText.trim() : "";
                datearray.push(date+'/'+location)
            })
            product.start_dates = datearray;
            console.log("Got all dates")

            // Get all the data for start_dates collection
            var AllStartDates = document.querySelectorAll('div.Course-calendar__info > div.Course-calendar__body > section')
            var StartDatesCollection = []
            var pslugArray = window.location.href.split('/');
            var pslug = pslugArray[pslugArray.length - 2] + '/' +pslugArray[pslugArray.length - 1] ;

            

            AllStartDates.forEach(async (ele) => {

                var productSlug = pslug;
                var dateString = ele.querySelector('header > div.Date').innerText.slice(3).trim();

                //Converting date to ISODate
                var months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
                var dtArray = dateString.split(' ')
                var dtMonth = months.indexOf(dtArray[1]) + 1;
                let date = dtArray[2]+'-'+dtMonth+'-'+dtArray[0]
                //var date = new Date(dtMonth+','+dtArray[0]+','+dtArray[2]);
                //date = date.toISOString().split("T")[0];  

                console.log("ISODATE",date)

                var location = ele.querySelector('header > div.Location').innerText;
                let priceArray = ele.querySelector('header > div.Price').innerText.split('€')
                var price = priceArray.length > 2 ? priceArray[2].match(/\d/g).join("") : priceArray[1].match(/\d/g).join("");
                var lessons = []
                var expandButton = ele.querySelector('header > button.Expandable__toggle');
                await expandButton.click();
                console.log("location", location)
                console.log("price",price)
                
                
                var alllessons = ele.querySelectorAll('div.Expandable__item > div.Course-info > div.Expandable.CourseDates.Expandable--init > table > tbody > tr')
                console.log("start dates",alllessons)
                console.log("Calling the for loop of lessons") 
                alllessons.forEach((e1) => {
                    let dateString = e1.querySelectorAll('td')[0].innerText.slice(3).trim();
                    let dtArray = dateString.split(' ')
                    let dtMonth = months.indexOf(dtArray[1]) + 1;
                    let date = dtArray[2]+'-'+dtMonth+'-'+dtArray[0]
                    //let date = new Date(dtMonth+','+dtArray[0]+','+dtArray[2]);
                    //date = date.toISOString().split("T")[0];  
                    var lesson = {
                        name : e1.querySelector('th').innerText,
                        date: date,
                        timeFrom : e1.querySelectorAll('td')[1].innerText.split(' ')[0],
                        timeTill : e1.querySelectorAll('td')[1].innerText.split(' ')[2]
                    }

                    lessons.push(lesson)
                    
                })
                console.log("lessons",lessons)
                var duration = ele.querySelector('div.Expandable__item > div.Course-info > dl > dd') ? ele.querySelector('div.Expandable__item > div.Course-info > dl > dd').innerText : "";
                var vat = ele.querySelectorAll('div.Expandable__item > div.Course-calendar__cta > table.Price-details > tbody > tr > td') ? ele.querySelectorAll('div.Expandable__item > div.Course-calendar__cta > table.Price-details > tbody > tr > td')[1].innerText.replace(',','.').split(' ')[1] : ""
                var totalPrice = ele.querySelector('div.Expandable__item > div.Course-calendar__cta > table.Price-details > tfoot > tr > td > div.Price') ? ele.querySelector('div.Expandable__item > div.Course-calendar__cta > table.Price-details > tfoot > tr > td > div').innerText.replace(',','.').split('\n')[0].split(' ')[1] : ""
                
                var alldates = {
                    productSlug : productSlug,
                    date : date,
                    location : location,
                    price : price,
                    lessons : lessons,
                    duration : duration,
                    vat : vat,
                    totalPrice : totalPrice
                }
                console.log("alldates",alldates)
                StartDatesCollection.push(alldates);
            
            })
            console.log("StartDatesCollection",StartDatesCollection)
            await new Promise(function(resolve) {
                setTimeout(resolve, 5000)
             });

            return {product, StartDatesCollection};
        })

        // get memeType and base64data from the image url
        
        for(const url of productData.product.images){
            try {
                var mediaType = url.split('.').pop().toLowerCase()
                if (mediaType === "jpg" || mediaType === "jpeg" || mediaType === "png" || mediaType === "gif"){
                    mediaType = `image/${mediaType}`
                    let img = await axios.get(url, { responseType: 'arraybuffer' });
                    let base64Data = Buffer.from(img.data).toString('base64');
                    allMedia.push({
                        url: url,
                        base64Data: base64Data,
                        mimeType: mediaType
                    })
                } else {
                    allMedia.push({
                        url: url
                    })
                }
            } catch (error) {
                console.log(error);
            }
        }

        productData.product.slug = pslug;
        //productData.product.StartDatesCollection = productData.StartDatesCollection;
        products.push(productData.product);
        productStartDates.push(productData.StartDatesCollection);
        //console.log("product:" , productData.product)
        
        if(productLinks.length > 0){
            AllProducts = productLinks
        }
        else{
            await page.goBack({ waitUntil: "networkidle0" });
            AllProducts = await page.$$('#Category-list__results > article > div.container > div.Course__body > a:nth-child(3)')    
        }
        
    }
        
    
    // console.log("products",products)
    // console.log("productStartDates",productStartDates)
        
    return {products, productStartDates, allMedia}
}


//scrapSiteData(models, "https://www.edubookers.com/072design")


var getAllProviderUrls = async () => {
    const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
    try {
        console.log("Scrapping the Provider Urls")
        console.log("Inside the method")

        const url = 'https://www.edubookers.com/alle-opleiders';

        await page.goto(url, {
            waitUntil: 'networkidle2',
        });

        var urls = await page.evaluate(async () => {
            var allUrlsText = document.querySelectorAll('ul.TrainingInstitute__wrapper > li');
            let urlArray = []
            allUrlsText.forEach((element) => {
                let allUrls = element.querySelectorAll('li > a');
                allUrls.forEach((el) => {
                    urlArray.push(el.href)
                })
            })
            
            return urlArray;
        })

        urls = urls.filter((e) => {return e !== url})

        console.log("Adding Urls to DB of count: ", urls.length)
        for (_url of urls){
            const result = await models.ProviderUrls.createorupdate(_url);
            console.log("Added/Updated ProviderUrl with Id:",result._id)
        }

        await browser.close()
        return urls;

    } catch (error) {
        console.log(error)
        browser.close()
    }
}

//getAllProviderUrls()




// // __________________________________________________________________
// //             LOGIC FOR BULL JOBS
// // __________________________________________________________________
var redisPath = process.env.REDIS_URL

// // ___________ Setting queue for Provider Urls ___________
const options = { repeat: { cron: '0 0 * * *' } }
const providerUrlQueue = new Queue('ScrapeURLs', redisPath);
providerUrlQueue.add('ScrapProvidersData', options);

// // ___________ Setting queue for Proider Data ___________
 const providersQueue = new Queue('ScrapeProvidersQueue', redisPath);


// // ___________ Method for running Provider jobs ___________
const scrapeAllProviders = (urls) => {
    console.log("Calling to scrap all providers")
    for (const _url of urls) {
        providersQueue.add({url: _url});
    }
    providersQueue.process((job) => {
        const url = job.data.url;
        scrapSiteData(models, url);
        done()
    })
}

providerUrlQueue.process('ScrapProvidersData', async (job, done) => {

    let urls = await getAllProviderUrls();
    console.log("urlsCount: ", urls.length);
    

    scrapeAllProviders(urls);
    done()
})