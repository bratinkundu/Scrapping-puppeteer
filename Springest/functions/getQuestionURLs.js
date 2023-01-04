const puppeteer = require('puppeteer');

var getQuestionURLs = async (page) => {
    var browser = null
    try {
        browser = await puppeteer.launch(
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
        console.log("Inside the getQuestionUrlsMethod")

        const url = 'https://www.springest.nl/vragen';
        console.log(url);

        await page.goto(url, {
            waitUntil: 'networkidle2',
        });
        var allQuestionURL = []
        var next = true
        while (next) {
            await page.waitForSelector('ul.faq-list')
            await page.waitForTimeout(2000)
            // var questionsInOnePage = []
            var [questionsInOnePage, next] = await page.evaluate(async () => {
                var questionURLs = Array.from(document.querySelectorAll('#questions div.panel__content > ul > li > a.faq-list__link')).map(el => el.href)
                var nextButton = document.querySelector('li.pagination__item--next > a.pagination__button.button--link')
                next = nextButton ? true : false
                return [questionURLs, next];
            })
            allQuestionURL = [...allQuestionURL, ...questionsInOnePage]

            if (next) {
                const nextButtonThere = await page.$eval('li.pagination__item--next > a.pagination__button.button--link', el => el.href)
                if (nextButtonThere) {
                    page.click('li.pagination__item--next > a.pagination__button.button--link')
                        .catch(err => {
                            console.log('Error while clicking next button in getQuestionURLs\n', err);
                        })
                    await page.waitForNavigation({ waitUntil: 'networkidle0' })
                }
            }

        }
        return allQuestionURL
    }
    catch (error) {
        console.log('Error in getQuestionURLs and closing the function\n', error);
    } finally {
        browser.close();
    }
}

module.exports = getQuestionURLs