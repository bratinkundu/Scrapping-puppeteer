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
    Media : require('./models/Media')(mongoose)
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
        });

        console.log("Calling providers")
        let providers = await getProviders(page)
        console.log(providers)
        console.log("Adding all the Providers")

        for(provider of providers){
            const result = await models.Provider.createorupdate(provider)
            console.log("Added/Updated provider with id: ", result._id)
        }

        console.log("Complete!!")


        
    } catch (error) {
        console.log(error)
    }
}


var getProviders = async (page) => {
    let AllProviderATags = await page.$$('div.panel.panel-default > div.panel-heading > h4 > a');

    const allProviders = []

    for(let i=0; i< AllProviderATags.length; i++){
        await page.waitForTimeout(2000);
        await AllProviderATags[i].click();
        console.log(i)
        var num = i

        let provider = await page.evaluate(async (num) => {
            console.log(num)
            let heading = "#heading-"+(parseInt(num) +1)
            let collapse = "#collapse-"+(parseInt(num) +1)

            console.log(heading,collapse)

            let title = document.querySelector(heading+' > h4.panel-title > a > span').innerText.trim()
            console.log(title)
            let slug = title.replaceAll(" ","-")

            let allCourses = document.querySelectorAll(collapse+" > div.panel-body.blue > div.row > div.col-xs-12.col-md-4 > div.row > div.col-xs-12 > ul > li")
            let courses = []
            allCourses.forEach((el) => {
                console.log(el.innerText.trim())
                courses.push(el.innerText.trim())
            })

            let allSpanElements = document.querySelectorAll(collapse+" > div.panel-body.blue > div.row >div.col-xs-12.col-md-8 > div.row > div.col-xs-12.col-md-6")[0].querySelectorAll('span')

            let flag = 1
            for(let i =0; i < allSpanElements.length; i++){
                if(allSpanElements[i].classList.value == 'bold' && flag == 1){
                    if(allSpanElements[i+1].classList.value == ''){
                        var phoneNumberArray = allSpanElements[i+1].innerText.trim().split(' ')
                        var phoneNumber = phoneNumberArray[1]
                        console.log("phoneNumber",phoneNumber)
                        i = i+1
                    }
                    if(allSpanElements[i+1].classList.value == ''){
                        var emailArray = allSpanElements[i+1].innerText.trim().split(' ')
                        var email = emailArray[1]
                        console.log("email", email)
                        i = i+1
                    }
                    if(allSpanElements[i+1].classList.value == ''){
                        var websiteArray = allSpanElements[i+1].innerText.trim().split(' ')
                        var website = websiteArray[1]
                        console.log("website", website)
                        i = i+1
                    }
                    flag = 2
                    i = i + 1
                    if(i+1 > allSpanElements.length){break;}
                    console.log("i",i)
                    console.log("allSpanElements[i].classList.value",allSpanElements[i].classList.value)
                }
                if(allSpanElements[i].classList.value == 'bold margin' && flag == 2){
                    console.log("Inside second if::")
                    var visitingAddress = allSpanElements[i+1].innerText.trim()
                    var visitingPostalCodePlace = allSpanElements[i+2].innerText.trim()
                    flag = 3
                    i = i +3
                    if(i+3 > allSpanElements.length){break;}
                }
                if(allSpanElements[i].classList.value == 'bold margin' && flag == 3){
                    console.log("Inside third if::")
                    var postalAddress = allSpanElements[i+1].innerText.trim()
                    var postalCodePlace = allSpanElements[i+2].innerText.trim()
                }
            }

            let branchElements = document.querySelectorAll(collapse+" > div.panel-body.blue > div.row > div.col-xs-12.col-md-8 > div.row.vestigingen > div.col-xs-12.vestigingen__content > div.row")[1].querySelectorAll('div.col-xs-12.col-md-6.vestigingen__vestiging > span')
            let branches = []
            branchObj = branchElements.length > 0 ? {branchAddress: branchElements[0].innerText.trim(), branchPostalCodePlace: branchAddress[1].innerText.trim()} : {}
            branches.push(branchObj)


            let allSpanElements2 = document.querySelectorAll(collapse+" > div.panel-body.blue > div.row >div.col-xs-12.col-md-8 > div.row > div.col-xs-12.col-md-6")[1].querySelectorAll('span')
            let NIBHVKeurmerknumber = ''
            let FirebnoNumber = ''

            allSpanElements2.forEach((el) => {
                if(el.innerText.includes('Keurmerknummer')){
                    let NIBHVKeurmerknumberArray = el.innerText.trim().split(' ')
                    NIBHVKeurmerknumber = NIBHVKeurmerknumberArray[1]
                }
                else if(el.innerText.includes('Fire bno nummer')){
                    let FirebnoNumberArray = el.innerText.trim().split(' ')
                    FirebnoNumber = FirebnoNumberArray[3]
                }
            })


            return{
                title : title,
                slug : slug,
                visitingAddress : visitingAddress,
                visitingPostalCodePlace : visitingPostalCodePlace,
                NIBHVKeurmerknumber : NIBHVKeurmerknumber,
                FirebnoNumber : FirebnoNumber,
                phoneNumber : phoneNumber,
                email : email,
                website : website,
                postalAddress : postalAddress,
                postalCodePlace : postalCodePlace,
                courses : courses,
                branches : branches
            }

        }, num)

        allProviders.push(provider)
    }

    return allProviders
}


scrapSiteData(models,"http://www.nibhv.nl/opleiders#listview")