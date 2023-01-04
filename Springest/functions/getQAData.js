const puppeteer = require('puppeteer');
var getQAData = async (questionURLs) => {
    console.log("Inside getQAData");
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

        var allQuestionData = []
        for (var questionURL of questionURLs) {
            try {
                // console.log(questionURL);
                await page.goto(questionURL)
                await page.waitForSelector('section.panel')
                await page.waitForTimeout(1000)

                var questionData = await page.evaluate(() => {
                    var slug = window.location.pathname
                    var authorElement = document.querySelector('#questions > section > section > div.question__title > span')
                    var posted_by = ''
                    if (authorElement) {
                        posted_by = authorElement.textContent.replace('Gesteld door', '').replace(':', '').trim()
                    }
                    console.log('posted_by: ', posted_by);
                    var description = ''
                    document.querySelectorAll('#questions > section > section > div.question__item').forEach((element) => {
                        description += '\n' + element.innerText
                    })
                    console.log('description: ', description);
                    var themes = []
                    var themeElements = Array.from(document.querySelectorAll('#breadcrumb > div > div.breadcrumb-wrapper.section > ul > li.breadcrumb__item.list-item > a'))
                    if (themeElements.length > 0) {
                        var themes = themeElements.map(el => el.getAttribute('href'))
                        console.log('themes: ', themes);
                    } else {
                        themeElements = []
                    }
                    var answers = []
                    document.querySelectorAll('div.panel.question__comments > div.comment-item').forEach((element) => {
                        var suggestedElement = element.querySelector('.suggested-product')
                        var advised_slug = suggestedElement ? element.querySelector('.suggested-product h3 a').getAttribute('href') : ''
                        console.log('advised_slug: ', advised_slug);
                        var by_name = element.querySelector('.comment-item__author-name').textContent.trim()
                        console.log('by_name: ', by_name);
                        var by_provider_url = ''
                        var by_slug = ''
                        var providerElement = element.querySelector('.comment-item__provider-name')
                        if (providerElement) {
                            var by_provider = providerElement.textContent.trim()
                            console.log('by_provider: ', by_provider);
                            by_provider_url = providerElement.querySelector('a')
                            by_slug = by_provider_url ? by_provider_url.getAttribute('href') : ''
                        }

                        var date = element.querySelector('.comment-item__text abbr')
                        date = date ? date.getAttribute('datetime') : ''
                        // remove date
                        element.querySelector('.comment-item__text abbr') ?
                            element.querySelector('.comment-item__text abbr').remove()
                            : null
                        var text = element.querySelector('.comment-item__text')
                        text = text ? text.textContent.trim() : ''
                        text = text ? text.substring(0, text.length - 2) : ''
                        console.log('date: ', date);
                        answers.push({
                            by_name,
                            by_provider,
                            by_slug,
                            text,
                            date,
                            advised_slug
                        })
                    })
                    return {
                        slug: slug,
                        posted_by,
                        description,
                        themes,
                        answers,
                    }
                })
                if (questionData.posted_by === '') {
                    // get element by text xpath
                    const question = await page.$x('//*[contains(text(), "Vraag gesteld door")]')

                    if (question.length > 0) {
                        const postedBy = await question[0].evaluate(node => node.textContent.replace('Vraag gesteld door', '').replace(':', '').trim())
                        questionData.posted_by = postedBy
                    }
                }
                allQuestionData.push(questionData)
            } catch (error) {
                console.log(`Error in question: ${questionURL} \n`, error);
            }
        }
        return allQuestionData
    } catch (error) {
        console.log('Error in getQAData and closing the function\n___________________\n', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = getQAData