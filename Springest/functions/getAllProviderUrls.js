const puppeteer = require('puppeteer');
var getAllProviderUrls = async (ProviderUrls) => {
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
    try {

        console.log("Inside the method")

        const url = 'https://www.springest.nl/alle-aanbieders';

        await page.goto(url, {
            waitUntil: 'networkidle2',
        });

        var allProviderURLs = []
        var next = true
        while (next) {
            try {
                await page.waitForSelector('div.section.section--popular-providers ul.logo-box__list > li.logo-box__item')
                await new Promise(function (resolve) {
                    setTimeout(resolve, 2000)
                });
                var [providersURLs, next] = await page.evaluate(async () => {
                    var nextButton = true
                    var providerUrlsInOnePage = document.querySelectorAll('div.section.section--popular-providers ul.logo-box__list > li.logo-box__item > a')
                    console.log("providerUrlsInOnePage: ", providerUrlsInOnePage)
                    console.log("providerUrlsInOnePage.length: ", providerUrlsInOnePage.length)
                    const result = []
                    providerUrlsInOnePage.forEach((element) => {
                        result.push({ url: element.href })
                        console.log(element.href)
                    })
                    if (!document.querySelector('.pagination__item--next > a')) {
                        nextButton = false
                    }
                    return [result, nextButton]
                })
                allProviderURLs = [...allProviderURLs, ...providersURLs]
                if (next) {
                    await page.click('.pagination__item--next > a').catch(err => {
                        // console.log(err.message);
                    })
                } else {
                    console.log('No more provider urls annd breaking the loop');
                    break
                }
            } catch (error) {
                console.log('Error while fetching proiderUrls from page\n', error)
            }
        }
        browser.close();
        console.log("Length: ", allProviderURLs.length)
        // console.log('Storing url of providers');
        // for (const providerUrl of allProviderURLs) {
        //     const result = await ProviderUrls.createorupdate(providerUrl)
        // }
        return allProviderURLs;
    } catch (error) {
        console.log('Error in function getAllProviderUrls and closing the function\n', error)
    }
}

module.exports = getAllProviderUrls;
