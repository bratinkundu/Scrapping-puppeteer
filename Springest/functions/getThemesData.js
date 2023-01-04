const puppeteer = require('puppeteer');
const axios = require("axios");

var getImageInfo = async (url) => {
    var mimeType = `image/${url.split('.').pop()}`
    let img = await axios.get(url, { responseType: 'arraybuffer' });
    let base64Data = Buffer.from(img.data).toString('base64');
    return {
        url,
        mimeType,
        base64Data
    }
}


var getThemesData = async () => {
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


        console.log("Inside getThemesData method")

        const url = 'https://www.springest.nl/';

        await page.goto(url, {
            waitUntil: 'networkidle2',
        });

        var themeURLS = await page.evaluate(async () => {
            var anchorElements = document.querySelectorAll('ul.category-list li.category-list__item a.category-list__title-link')
            var URLS = []
            anchorElements.forEach((element) => {
                URLS.push({ url: element.href })
            })
            console.log("URLS: ", URLS)
            return URLS
        })
        const allThemesData = []
        for (const theme of themeURLS) {
            try {

                console.log("theme: ", theme.url)
                await page.goto(theme.url, {
                    waitUntil: 'networkidle2',
                });
                // ________________ level 1 themes ________________
                await page.waitForSelector('h1.content__title.page__title');
                var themeData = await page.evaluate(async () => {
                    var title = document.querySelector('h1.content__title.page__title').textContent.trim()
                    console.log("title: ", title)
                    var slug = window.location.pathname
                    console.log("slug: ", slug)
                    var level = 1
                    console.log("level: ", level)
                    var index = false
                    console.log("index: ", index)
                    var related_themes = []
                    document.querySelectorAll('div.panel ul.subject-list li.subject-title a.subject-list__link')
                        .forEach((element) => {
                            related_themes.push(element.href)
                        })
                    console.log("related_themes: ", related_themes)
                    var description = ''
                    var sectionContent = document.querySelector('.section-content')
                    var panel = document.querySelector('.panel:nth-child(3)')
                    var allImages = []
                    if (sectionContent) {
                        console.log("sectionContent: ", sectionContent)
                        description += sectionContent.textContent.trim()
                        allImages = [...allImages, ...sectionContent.querySelectorAll('img')]
                    }
                    if (panel) {
                        var logoBoxElement = document.querySelector('.logo-box')
                        logoBoxElement ? logoBoxElement.remove() : null

                        console.log("panelWithBorder: ", panel)
                        description += '\n' + panel.textContent.trim()
                        allImages = [...allImages, ...panel.querySelectorAll('img')]

                    }
                    allImages = allImages.map((image) => image.src)
                    console.log("description: ", description)
                    console.log("allImages: ", allImages)
                    return {
                        slug,
                        title,
                        index,
                        level,
                        description,
                        related_themes,
                        media: allImages
                    }
                })
                var allImages = themeData.media
                themeData.media = []
                if (allImages.length > 0) {
                    for (const imageUrl of allImages) {
                        try {
                            var result = await getImageInfo(imageUrl)
                            themeData.media.push(result)
                        } catch (error) {
                            console.log("error: ", error)
                            continue
                        }
                    }
                    console.log("Got all images")
                }
                allThemesData.push(themeData)

            } catch (error) {
                console.log('Error in fetching one level 1 theme\n', error)
            }
        }

        // __________________ level 2 themes __________________
        console.log("Fetching level 2 theme data")
        var allLevelTwoThemesData = []
        for (const theme of allThemesData) {
            for (const relatedTheme of theme.related_themes) {

                try {
                    await page.goto(relatedTheme, {
                        waitUntil: 'networkidle2'
                    })
                    var lvlTwoTheme = await page.evaluate(async () => {
                        var slug = window.location.pathname
                        console.log("slug: ", slug)
                        var title = slug.split('/').pop()
                        console.log("title: ", title)
                        var url = window.location.href
                        console.log("url: ", url)
                        var index = false
                        console.log("index: ", index)
                        var level = 2
                        console.log("level: ", level)
                        var description = ''
                        var media = []
                        var keuzehulpElement = document.querySelector('#keuzehulp')
                        var help_choosingElement = document.querySelector('#help_choosing')
                        // ____________
                        var allImages = []
                        if (keuzehulpElement) {
                            console.log("keuzehulpElement: ", keuzehulpElement)
                            description += keuzehulpElement.textContent.trim()
                            allImages = [...allImages, ...keuzehulpElement.querySelectorAll('img')]
                        }
                        if (help_choosingElement) {
                            console.log("help_choosingElement: ", help_choosingElement)
                            description += '\n' + help_choosingElement.textContent.trim()
                            allImages = [...allImages, ...help_choosingElement.querySelectorAll('img')]

                        }
                        console.log("description: ", description)
                        allImages = allImages.map((image) => image.src)
                        // ___________

                        console.log("description: ", description)
                        console.log("media: ", media)
                        return {
                            slug,
                            url,
                            title,
                            level,
                            index,
                            description,
                            media: allImages
                        }
                    })
                    var allImageUrls = lvlTwoTheme.media
                    lvlTwoTheme.media = []
                    if (allImageUrls.length > 0) {
                        for (const imageUrl of allImageUrls) {
                            var result = await getImageInfo(imageUrl)
                            lvlTwoTheme.media.push(result)
                        }
                        // console.log("Got all images")
                    }
                    // console.log("themeData.title: ", lvlTwoTheme.title)
                    const youTubeVideo = await page.evaluate(async () => {
                        const ytubeElement = document.querySelector('.ytp-cued-thumbnail-overlay-image')
                        if (ytubeElement) {
                            ytubeElement.click()
                            const ytubeuUrl = document.querySelector('.video-stream.html5-main-video').src
                            return {
                                url: ytubeuUrl,
                                mimeType: "video"
                            }
                        }
                    })
                    youTubeVideo ? lvlTwoTheme.media.push(youTubeVideo) : null
                    allLevelTwoThemesData.push(lvlTwoTheme)

                } catch (error) {
                    console.log('Error in fetching one level 2 theme\n', error)
                }
            }


        }
        allThemesData.push(...allLevelTwoThemesData)
        return allThemesData;

    } catch (error) {
        console.log('Error in getThemesData Function:\n', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}


module.exports = getThemesData
