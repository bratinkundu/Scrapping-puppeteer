const puppeteer = require('puppeteer');
const axios = require('axios').default
require('dotenv').config()
const FileSystem = require("fs");


console.log("here we go!")



var scrapSiteData = async (pageurl) =>  {
    try {
        console.log("Scrapping data for Url:",pageurl)
        
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        console.log("Inside the method")

        const url = pageurl;

        let links = ['tools/']
        var AllToolsData = []

        links.forEach(async el => {
            for(let i=1; i<=10; i++){
                await page.goto(url + el + i, {
                    waitUntil: 'networkidle2',
                });

               
                var toolList = await page.$$('div.col-xl-4.col-lg-6.col-md-4.col-sm-6.col-12 > a')

                for(var j=0; j< toolList.length; j++) {

                   let shortDescription = await page.evaluate((j) => {
                       return document.querySelectorAll('div.col-xl-4.col-lg-6.col-md-4.col-sm-6.col-12 > a > span.location')[j].innerText
                   }, j)
                    await toolList[j].click()
                    await page.waitForSelector("#overview")

                    let toolData = await page.evaluate(() => {

                        var longDescription = ''
                        if(document.querySelector("#overview").innerText == ''){
                            
                            let allDesc = document.querySelectorAll('div.w-richtext')
                            if(allDesc.length > 0){
                                allDesc.forEach(el => {
                                    longDescription += el.innerText
                                })
                            }
                            else{
                                let allP = document.querySelectorAll('div.company-details > p')
                                allP.forEach(e => {
                                    longDescription += e.innerText
                                })
                            }
                            
                        }

                        else{
                            longDescription = document.querySelector("#overview").innerText
                        }

                        let title = document.querySelector("#hero_title") ? document.querySelector("#hero_title").innerText : ''
                        let categories = document.querySelectorAll("#tool_sidebar > li").length == 3 ? document.querySelectorAll("#tool_sidebar > li")[1].innerText.split(':')[1].trim() : document.querySelectorAll("#tool_sidebar > li")[0].innerText.split(':')[1].trim()
                        let website = document.querySelectorAll("#tool_sidebar > li").length == 3 ? document.querySelectorAll("#tool_sidebar > li")[2].innerText.split(' ')[1].trim() : document.querySelectorAll("#tool_sidebar > li")[1].innerText.split(' ')[1].trim()
                        let imageUrl = document.querySelector("#tool_logo") ? document.querySelector("#tool_logo").src : '' 

                        return {longDescription, title, categories, website, imageUrl}
                    })

                    toolData.shortDescription = shortDescription

                    console.log("toolData", toolData)
                    AllToolsData.push(toolData)

                    await page.goBack({ waitUntil: "networkidle0" });
                    console.log("Gone back")
                    toolList = await page.$$('div.col-xl-4.col-lg-6.col-md-4.col-sm-6.col-12 > a')
                }
            }
        })

        console.log("allTools", AllToolsData)
    }
    catch(er){
        console.log(er)
    }
}

var ScrapJobsData = async (pageurl) => {
    try {
        console.log("Scrapping data for Url:",pageurl)
        
        const browser = await puppeteer.launch({headless: false, args: [`--window-size=1920,1080`],
        defaultViewport: {
          width:1920,
          height:1080
        }});
        const page = await browser.newPage();
        console.log("Inside the method")

        const url = pageurl;

        let links = ['jobs/']
        var AllJobsData = []

        for(var k=0 ; k < links.length; k++) {
            for(let i=128; i<=150; i++){
                await page.goto(url + links[k] + i, {
                    waitUntil: 'networkidle2',
                });

                var jobList = await page.$$('a.job-list.d-none.d-md-flex')
                for(var j =0; j < jobList.length; j++){
                    console.log("j", j)
                    await page.evaluate((j) =>{
                        document.querySelectorAll('a.job-list.d-none.d-md-flex')[j].target = ''
                    }, j)
                    
                    await jobList[j].click()
                    await page.waitForSelector('h5.title')

                    let jobData = await page.evaluate(() => {
                        let title = document.querySelector('h5.title') ? document.querySelector('h5.title').innerText : ''
                        let location = document.querySelector('ul.meta > li > span') ? document.querySelector('ul.meta > li > span').innerText : ''  
                        let type = document.querySelector('ul.meta > li > strong') ? document.querySelector('ul.meta > li > strong').innerText : ''

                        let budgetArray = document.querySelector('div.job-details-body').innerText.split('\n').filter((e) => { return e.includes('Budget:') || e.includes("Hourly Range:")})
                        let budget = budgetArray.length > 0 ? budgetArray[0].split(':')[1] : ''

                        let postedArray = document.querySelector('div.job-details-body').innerText.split('\n').filter((e) => { return e.includes('Posted On:')})
                        let posted = postedArray.length > 0 ? postedArray[0].split(':')[1] : ''

                        let categoryArray = document.querySelector('div.job-details-body').innerText.split('\n').filter((e) => { return e.includes('Category:')})
                        let category = categoryArray.length > 0 ? categoryArray[0].split(":")[1] : ''

                        let countryArray = document.querySelector('div.job-details-body').innerText.split('\n').filter((e) => { return e.includes('Country:')})
                        let country = countryArray.length > 0 ? countryArray[0].split(":")[1] : ''

                        let backlist = ['Budget:', 'Posted On:', 'Category:', 'Country:', 'Hourly Range:', 'Skills:']
                        let a = document.querySelector('div.job-details-body').innerText.split('\n').filter((e) => backlist.every(s => !e.includes(s)))
                        let description = a.filter(q => q != '' ).join('')

                        return {title, location, type, budget, posted, category, country, description}

                    })

                    console.log("Job", jobData)
                    AllJobsData.push(jobData)

                    await page.goBack({ waitUntil: "networkidle0" });
                    console.log("Gone back")
                    jobList = await page.$$('a.job-list.d-none.d-md-flex')
                }
            }
        }

        console.log("AllJobs", AllJobsData)
        let data = FileSystem.readFileSync('result.json')
        let json = JSON.parse(data)
        let res = json.concat(AllJobsData)
        console.log("Added jobs to json. Count: ", res.length)
        FileSystem.writeFileSync('result.json', JSON.stringify(res), (error) => {if(error) throw error})

    } catch (error) {
        console.log(error)
    }
}

var ScrapLearnings = async (pageurl) => {
    try {
        console.log("Scrapping data for Url:",pageurl)
        
        const browser = await puppeteer.launch({headless: false, args: [`--window-size=1920,1080`],
        defaultViewport: {
          width:1920,
          height:1080
        }});
        const page = await browser.newPage();
        console.log("Inside the method")

        const url = pageurl;

        let links = ['tutorials/']
        var AllLearningData = []

        for(var k=0 ; k < links.length; k++) {
            for(let i=1; i<=31; i++){
                await page.goto(url + links[k] + i, {
                    waitUntil: 'networkidle2',
                });

                var partData = await page.evaluate(() => {

                    var tutList = document.querySelectorAll('div.blog-wrap.row > div.col-md-6.col-12 > div.blog')
                    let dataArray = []
                    for(let j=0; j< tutList.length; j++){
                       try {
                        let image = tutList[j].querySelector('div.media > a > img').src || ''
                        let title = tutList[j].querySelector('div.content > h6.title').innerText || '' 
                        let subHeading = tutList[j].querySelectorAll('div.content > ul.meta > li')[0].innerText || ''
                        let tool = tutList[j].querySelectorAll('div.content > ul.meta > li')[1].innerText || ''


                        console.log({title: title, subHeading: subHeading, tool: tool, image: image})

                        dataArray.push({title: title, subHeading: subHeading, tool: tool, image: image})
                       } catch (error) {
                           console.log(error)
                       }
                    }

                    return dataArray;
                })

                AllLearningData = AllLearningData.concat(partData)
            }
        }

        console.log("AllLearning", AllLearningData)
        FileSystem.writeFileSync('result.json', JSON.stringify(AllLearningData), (error) => {if(error) throw error})

    } catch (error) {
        console.log(error)
    }
}
//scrapSiteData("https://nocodery.com/")
//ScrapJobsData("https://nocodery.com/")
ScrapLearnings("https://nocodery.com/")
