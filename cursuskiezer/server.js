const puppeteer = require('puppeteer');
const axios = require('axios').default
require('dotenv').config()

console.log("here we go!")

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
    Provider : require('./models/Provider')(mongoose),
    Media : require('./models/Media')(mongoose),
    Course : require('./models/Course')(mongoose),
    Training : require('./models/Training')(mongoose)
}


var scrapSiteData = async (models, pageUrl) => {
    try {
        console.log("Scrapping the url:",pageUrl)
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        const url = pageUrl;
        console.log(url)

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 600000
        });

        console.log("Getting all the courses")
        
        let courses = await getAllCourses(page);
        console.log(courses)
        for(course of courses){
            // Get the media
            let media = await getMedia(course.picture)

            // Store the Media and get the ID
            let mediaResult = await models.Media.createorupdate(media);
            console.log("Added/Updated the media with id: ", mediaResult._id)
            course.picture = mediaResult._id

            // Store the course to DB
            let courseResult = await models.Course.createorupdate(course)
            console.log("Added/Updated the course with id: ",courseResult._id)
        }

        
        console.log("Getting all Trainings")
        let trainings = await getAllTrainings(page)
        console.log("trainings",trainings)


        for(training of trainings){
            // Store the training to DB
            let trainingResult = await models.Training.createorupdate(training)
            console.log("Added/Updated the training with id: ",trainingResult._id)
        }

        console.log("Getting all Providers")
        let providers = await getProviders(page)
        console.log("providers",providers)

        for(provider of providers){

            console.log(provider.picture)
            // Get the media
            let media = await getMedia(provider.picture)

            // Store the Media and get the ID
            let mediaResult = await models.Media.createorupdate(media);
            console.log("Added/Updated the media with id: ", mediaResult._id)
            provider.picture = mediaResult._id

            // Store the course to DB
            let providerResult = await models.Provider.createorupdate(provider)
            console.log("Added/Updated the provider with id: ",providerResult._id)
        }

        console.log("Operation Completed")
        browser.close();

    } catch (error) {
        console.log(error)
    }
}

var getAllCourses = async (page) => {
    //await page.waitForTimeout(10000)

    let courses = await page.evaluate(async () => {
        let allCourses = await document.querySelectorAll('div.courseSelect.hiddenPlaceholder')
        let allcourses = []
    
        allCourses.forEach(async (el) =>{
            let title = el.querySelector('h3').innerText
            console.log("title",title)
            let slug = el.querySelector('h3').innerText.replaceAll(' ','-')
            let picture = el.querySelector('div.selectLabel > img').src
    
            allcourses.push({title: title, slug: slug, picture: picture})
        })

        return allcourses;
    })
    

    return courses;
}

var getAllTrainings = async (page) => {

    let trainingList = await page.evaluate(async () => {

        let allTrainings = document.querySelectorAll('div.courseItem.in-range')
        let trainingArray = []

        allTrainings.forEach(async (el) =>{
            await el.querySelector('div.itemInfo > div.leesMeerButton.button.theme2').click()
    
    
            let provider = el.querySelector('div.itemInfo > div.opleidinginstituut > div.labelinfo > a > span').innerText.replaceAll(' ','-')
            let latitude = el.querySelector('div.itemInfo > div.latlong.hideOnDesktop.hideOnMobile').innerText.trim().split(',')[0]
            let longitude = el.querySelector('div.itemInfo > div.latlong.hideOnDesktop.hideOnMobile').innerText.trim().split(',')[1]
            let city = el.querySelector('div.itemInfo > div.locatie').innerText
            let street = el.querySelector('div.extraInfo > div.cursusstraatnaam').innerText
            let postalCodePlace = el.querySelector('div.extraInfo > div.cursuspostcode-plaats').innerText
            let trainingUrl = el.querySelector('div.extraInfo > div.cursuslink > div.labelinfo > a').href
            let startDateArray = el.querySelector('div.extraInfo > div.datum > div.labelinfo').innerText.split('-')
            let startDate = startDateArray[2]+'-'+startDateArray[1]+'-'+startDateArray[0]
    
            let training = {
                provider : provider,
                latitude : latitude,
                longitude : longitude,
                city : city,
                street : street,
                postalCodePlace : postalCodePlace,
                trainingUrl : trainingUrl,
                startDate : startDate
            }
    
            trainingArray.push(training)
        })

        return trainingArray
    })
    
    return trainingList
    //console.log(trainingArray)
}

var getMedia = async (url) => {
    try {

        var mediaType = url.split('.').pop().toLowerCase()
        if (mediaType === "jpg" || mediaType === "jpeg" || mediaType === "png" || mediaType === "gif"){
            mediaType = `image/${mediaType}`
            let img = await axios.get(url, { responseType: 'arraybuffer' });
            let base64Data = Buffer.from(img.data).toString('base64');

            return {
                url : url,
                base64Data : base64Data,
                mimeType: mediaType
            }
        } 
    } catch (error) {
        console.log(error);
    }
}

var getProviders = async (page) => {
    var AllProviders = await page.$$("div.courseItem.in-range > div.itemInfo > div.opleidinginstituut > div.labelinfo > a")
    let allProviderData = []
    let nameArray = []
    for (let i = 0; i < AllProviders.length; i++){
        let nameVal = await page.evaluate(el => el.textContent.trim(), AllProviders[i])

        if(nameArray.indexOf(nameVal) == -1){

            nameArray.push(nameVal)
            console.log("New provider",nameVal)
            await AllProviders[i].click({waitUntil: "networkidle2"})
            await page.waitForSelector('div.detailContent > div.detailImage',{timeout: 100000}) 
    
            let providerData = await page.evaluate(async () => {
                
                let provider = document.querySelector('div.stepContainer.detailTitle').innerText.trim();
                let info = document.querySelector('div.detailContent > div.detailText > div.opleidingsinstituutinfo').innerText
                let picture = document.querySelector('div.detailContent > div.detailImage > img').src 
                let street = document.querySelector('div.detailContent > div.detailText > div.contactgegevens > div.instituutstraat').innerText
                let postalCodePlace = document.querySelector('div.detailContent > div.detailText > div.contactgegevens > div.instituutpostcodeplaats').innerText
                let email = document.querySelector('div.detailContent > div.detailText > div.contactgegevens > div.instituutemail').innerText
                let website = document.querySelector('div.detailContent > div.detailText > div.contactgegevens > div.instituutwebsite').innerText
                
                return {
                    provider : provider,
                    info : info,
                    picture : picture,
                    street : street,
                    postalCodePlace : postalCodePlace,
                    email : email,
                    website : website
                }
            })
    
            providerData.url = await page.url()
            var slugArray = providerData.url.split('/')
            
            providerData.slug = slugArray[slugArray.length - 1]
            allProviderData.push(providerData)
    
            // Go Back and reset the variable
            await page.goBack({ waitUntil: "networkidle0" });
            AllProviders = await page.$$("div.courseItem.in-range > div.itemInfo > div.opleidinginstituut > div.labelinfo > a")
        }
        else{
            console.log("Already explored provider", nameVal)
            AllProviders = await page.$$("div.courseItem.in-range > div.itemInfo > div.opleidinginstituut > div.labelinfo > a")
            continue;
        }

        
    }

    return allProviderData;
}

scrapSiteData(models,"https://cursuskiezer.ehbo.nl/")