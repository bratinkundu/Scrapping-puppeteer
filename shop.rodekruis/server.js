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
    Media : require('./Models/Media')(mongoose),
    Provider : require('./Models/Provider')(mongoose),
    Option : require('./Models/Option')(mongoose),
    Course : require('./Models/Course')(mongoose)
}

var scrapSiteData = async (models, pageurl) =>  {
    try {
        console.log("Scrapping data for Url:",pageurl)
        
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        console.log("Inside the method")

        const url = pageurl;

        await page.goto(url, {
            waitUntil: 'networkidle2',
        });

        let courses = await getAllCourses(page)

        for(course of courses.allCourses){
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

        for(provider of courses.allProviders){
            let providerResult = await models.Provider.createorupdate(provider);
            console.log("Added/Updated the provider with id: ", providerResult._id)
        }

        for(option of courses.allCourseOptions){
            let organizerId = await models.Provider.getOrganizerId(option.organizator);
            option.organizator = organizerId

            let optionResult = await models.Option.createorupdate(option)
            console.log("Added/Updated the course option with id: ", optionResult._id)

        }


        console.log("All Courses", courses.allCourses)
        console.log("All CourseOptions", courses.allCourseOptions)
        console.log("All Providers", courses.allProviders)


    } catch (error) {
        console.log(error)
    }
}

var getAllCourses = async (page) => {
    
    var allCourseATag = await page.$$('li.item.product.product-item > div.carousel-product > div.carousel-product-info > h4 > a')
    var allCourses = []
    var allCourseOptions = []
    var allProviders = []

    // Getting all the courses
    for (let i = 0; i < allCourseATag.length; i++){
        await allCourseATag[i].click()
        await page.waitForSelector('div.fotorama__stage__shaft > div > img')
        let course = await page.evaluate(async () => {
            let picture = document.querySelector('div.fotorama__stage__shaft > div > img').src
            let title = document.querySelector('div.product-info-main > div.page-title-wrapper.product > h1.page-title').innerText
            let sku = document.querySelector('div.product-info-stock-sku > div.product.attribute.sku > div.value').innerText
            let courseDuration = document.querySelector('span.course-duration') ? document.querySelector('span.course-duration').innerText : ''
            let courseParticipants = document.querySelector('span.course-participants') ? document.querySelector('span.course-participants').innerText : ""
            let price = document.querySelector('span.price.min-price').innerText
            let productDetails = []
            let productDetailsArray = document.querySelectorAll('div.prod-details-usp > ul > li')

            productDetailsArray.forEach((el) => {
                productDetails.push(el.innerText)
            })

            let productOveriew = document.querySelector('div.product.attribute.overview').innerText

            let productInformation = document.querySelector('div.product.attribute.description > div.value').innerText

            let faqArray = document.querySelectorAll('#product_faqs > div')
            let faq = []

            for(let i = 0; i < faqArray.length; i++) {
                let faqObj = {}
                if(faqArray[i].dataset.role == 'collapsible'){
                    faqObj.question = faqArray[i].innerText
                    faqObj.answer = faqArray[i+1].innerText
                    i++;
                    faq.push(faqObj)
                }
            }

            let productLanguage = ''
            let productLearnWhat = ''
            let productRepeatCourse = ''
            let productHelpWho = ''
            let productLearningSkills = ''
            let productLearningHow = ''
            let productCertificate = ''
            let productCertificateValid = ''
            let productMeets = ''
            let ratings = []

            let tdArray = document.querySelectorAll('#product-attribute-specs-table > tbody > tr > td')

            for(let i=0; i<tdArray.length; i++){

                if(tdArray[i].hasAttribute('data-th')){
                    if(tdArray[i].dataset.th == 'Taal / language'){productLanguage = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Wat wil je leren?'){productLearnWhat = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Is dit een herhalingscursus?'){productRepeatCourse = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Wie wil je kunnen helpen?'){productHelpWho = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Je leert (om EHBO te verlenen bij)'){productLearningSkills = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Hoe wil je leren?'){productLearningHow = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Geldigheid certificering'){productCertificateValid = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Wat krijg je na afloop?'){productCertificate = tdArray[i].innerText}
                    else if(tdArray[i].dataset.th == 'Voldoet aan'){productMeets = tdArray[i].innerText}
                }
            }

            let ratingArray = document.querySelectorAll('div.slick-slide.slick-cloned > figure')

            ratingArray.forEach((el) => {
                let rating = {
                    star : '', // Result in percentage in website
                    author : el.querySelector('div.author').innerText,
                    review : el.querySelector('blockquote').innerText
                }

                ratings.push(rating)
            })

            return {
                slug : '',
                title : title,
                sku : sku,
                picture : picture,
                courseDuration : courseDuration,
                courseParticipants : courseParticipants,
                price : price,
                productDetails : productDetails,
                productOveriew : productOveriew,
                productInformation : productInformation,
                faq : faq,
                productLanguage : productLanguage,
                productLearnWhat : productLearnWhat,
                productRepeatCourse : productRepeatCourse,
                productHelpWho : productHelpWho,
                productLearningSkills : productLearningSkills,
                productLearningHow : productLearningHow,
                productCertificate : productCertificate,
                productCertificateValid : productCertificateValid,
                productMeets : productMeets,
                ratings : ratings
            }

        })

        var moreOptionsButton = await page.$('#findByNearByCourse')
        await moreOptionsButton.click()


        var modalElement = await page.$('#modalElement')
        

        while(true){
            let cstyle = await page.evaluate(async () => {
                let modal = document.querySelector('#modalElement')
                return modal.style.display
            })

            if(cstyle == 'block' || cstyle == ''){
                break;
            }
        }

        let loadMoreButton = await page.$('#loadMoreResults')

        while(true){
            let lstyle = await page.evaluate(() => {
                let btn = document.querySelector('#loadMoreResults')
                return btn.style.display
            })
            console.log(lstyle)
            if(lstyle == 'none'){
                break;
            }
            else{
                await loadMoreButton.click()
                await page.waitForTimeout(3000)
            }
        }

        let courseOptions = await page.evaluate(async () => {

            let allCourseOptions = []
            let allProviders = []
            let allTDRow = document.querySelectorAll('tr.training-row')
            for(let i=0; i< allTDRow.length; i++){
                let DateTimeArray = allTDRow[i].querySelector('td.table_loc_date') ? allTDRow[i].querySelector('td.table_loc_date').innerText.split('\n') : []
                let startDate = DateTimeArray.length > 0 ? DateTimeArray[0] : ''
                let startTime = DateTimeArray.length > 0 ? DateTimeArray[1] : ''
                let availablity = allTDRow[i].querySelector('td.table_loc_availability') ? allTDRow[i].querySelector('td.table_loc_availability').innerText : ''
                let price = allTDRow[i].querySelector('td.table_loc_price').innerText
                let meetingDays = []

                let providerArray = allTDRow[i].querySelector('td.table_loc_location').innerText.split('\n')
                let provider = {
                    name : providerArray[1].split(':')[1],
                    address : providerArray[3],
                    email : providerArray[2].split(':')[1]
                }

                let organizator = provider.name

                allProviders.push(provider)

                let meetingsArray = allTDRow[i+1].querySelectorAll('td') ? allTDRow[i+1].querySelectorAll('td')[0].innerHTML.trim().split('<br>') : []
                meetingsArray.forEach((el) => {
                    let dataArray = el.split(' ')
                    meetingDays.push({date: dataArray[0], startTime: dataArray[1], endTime: dataArray[3]})
                })

                let remarks = allTDRow[i+1].querySelectorAll('td') ? allTDRow[i+1].querySelectorAll('td')[1].innerText : ''
                i++;
                allCourseOptions.push({
                    startDate : startDate,
                    startTime : startTime,
                    availablity : availablity,
                    price : price,
                    organizator : organizator,
                    meetingDays : meetingDays,
                    remarks : remarks
                })

            }

            return {allCourseOptions, allProviders}
        })

        console.log("courseOptions", courseOptions.allCourseOptions)
        allCourseOptions = allCourseOptions.concat(courseOptions.allCourseOptions)

        console.log("providers", courseOptions.allProviders)
        allProviders = allProviders.concat(courseOptions.allProviders)

        var pslugArray = await page.url().split('/');
        course.slug = '/'+pslugArray[pslugArray.length -1]

        console.log("course", course)
        allCourses.push(course)

        await page.goBack({ waitUntil: "networkidle0" });
        allCourseATag = await page.$$('li.item.product.product-item > div.carousel-product > div.carousel-product-info > h4 > a')

    }

    
    return {allCourses, allCourseOptions, allProviders}
    
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

scrapSiteData(models, 'https://shop.rodekruis.nl/ehbo-cursussen?product_list_mode=list')