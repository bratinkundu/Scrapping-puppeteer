const axios = require('axios').default;
var getProviderData = async (page) => {
    try {
        var providerData = await page.evaluate(async () => {
            var slug = window.location.pathname
            console.log(slug);
            var name = document.querySelector('#page > div.container.container--page > h1')
            name = name ? name.textContent.trim() : ''
            console.log(name);
            var address = document.querySelector('#page > div.container.container--page span.street-address')
            address = address ? address.textContent.trim() : ''
            console.log(address);
            var postcode = document.querySelector('#page > div.container.container--page span.postal-code')
            postcode = postcode ? postcode.textContent.trim() : ''
            console.log(postcode);
            var city = document.querySelector('#page > div.container.container--page span.locality')
            city = city ? city.textContent.trim() : ''
            console.log(city);
            var socialLinkElements = document.querySelectorAll('#page > div.container.container--page > section:nth-child(3) > div.panel.profile__main-info > div > ul.social-list > li.social-list__item');
            var socialLinks = [];
            socialLinkElements.forEach((element) => {
                // get class name and url
                var socialSiteName = element.querySelector('a > span.social-list__icon').className.split(' ').pop().substring(3)
                socialLinks.push({
                    "type": socialSiteName,
                    "url": element.querySelector('a').getAttribute('href')
                })
            })
            console.log(socialLinks);
            var qualityMarks = [];
            var qualityMarksElements = document.querySelectorAll('#page > div.container.container--page > section:nth-child(4) > div:nth-child(3) > div > ul.logo-box__list > li')
            qualityMarksElements.forEach((element) => {
                qualityMarks.push(element.querySelector('a.logo-box__link').getAttribute('href'))
            })
            console.log(qualityMarks);
            var logo = document.querySelector('#page > div.container.container--page > div > img')
            logo = logo ? logo.getAttribute('src') : ''
            console.log(logo);
            var hero = ''
            var description = document.querySelector('#beschrijving > div')
            description = description ? description.textContent.trim() : ''
            console.log(description);
            var media = []
            var allImages = document.querySelectorAll('.image-gallery > .image-gallery__thumbs > a')
            if (allImages) {
                allImages.forEach(async (el) => {
                    var smallImgUrl = el.href
                    var bigImgUrl = smallImgUrl.replace('small', 'big')
                        .replace('jpeg', 'jpg')
                        .replace('png', 'jpg')
                        .replace('JPG', 'jpg')
                        .replace('PNG', 'jpg')
                        .replace('JPEG', 'jpg')
                        
                    // images.push(bigImgUrl)
                    var mimeType = `image/${bigImgUrl.split('.').pop()}`
                    media.push({
                        url: bigImgUrl,
                        mimeType
                    })
                    console.log(media);
                })
                console.log("Got all images")
            }

            console.log('media images: ', media);
            var trainers = []
            var trainersButton = document.querySelector('div.profile__tabs > div > div.tabs__wrapper > ul > li:nth-child(5) > a')
            if (trainersButton) {
                await trainersButton.click();
                console.log('clicked trainers');
                var trainersElements = document.querySelectorAll('#trainers > div > div.trainer-profile__avatar > a')
                // console.log('trainersElements: ',typeof(trainersElements) , trainersElements);
                trainersElements.forEach((element) => {
                    var trainerLink = element ? element.getAttribute('href') : ''
                    trainers.push(trainerLink)
                })
            }

            var reviewScore = document.querySelector('#ervaringen > div.review-score.product-average-rating > div.review-score__square--large')
            reviewScore = reviewScore ? Number(reviewScore.textContent.replace('.', '').replace(',', '.')) : null
            console.log(reviewScore);
            var reviewCount = document.querySelector('#ervaringen > div.review-score.product-average-rating > div.review-score__details > div > span')
            reviewCount = reviewCount ? Number(reviewCount.textContent.replace('.', '')) : 0
            console.log(reviewCount);
            // get it from review collection
            var review = ''
            // Need to get array of reviews & convert to ISO
            document.querySelector('div.profile__tabs > div > div.tabs__wrapper > ul > li:nth-child(1) > a').click();
            var provider = {
                slug: slug,
                name: name,
                address: address,
                postcode: postcode,
                city: city,
                social_links: socialLinks,
                quality_marks: qualityMarks,
                logo: logo,
                hero: hero,
                description: description,
                media: media,
                trainers: trainers,
                products: [],
                products_check: '',
                reviewScore: reviewScore,
                reviewCount: reviewCount,
                reviews: [],
            }
            return provider
        })

        for (const media of providerData.media) {
            try {
                let img = await axios.get(media.url, { responseType: 'arraybuffer' });
                let base64Data = Buffer.from(img.data).toString('base64');
                media.base64Data = base64Data
                media.providerSlug = providerData.slug
                media.productSlug = ''
            } catch (error) {
                console.log(error);
                continue
            }
        }


        try {
            // get video element
            var videoElement = await page.$('.profile__video');
            if (videoElement) {
                await page.click('.profile__video');
                await page.waitForSelector('iframe');
                const frameUrl = await page.evaluate(() => {
                    var iframeElement = document.getElementsByTagName('iframe')[0]
                    return iframeElement.src
                });
                // console.log(frameUrl);
                providerData.media.push({
                    url: frameUrl,
                    mimeType: 'video',
                    providerSlug: providerData.slug,
                    productSlug: ''
                })
            } else {
                // console.log('No video');
            }
        } catch (error) {
            console.log('Error getting video: ', error);
        }

        try {

            // after click on more  and scrap the products list array
            var allProductButton = await page.$('div.panel.with-border.profile__product-list > div.panel__content > a');
            if (allProductButton) {
                var next = true;
                allProductButton.click();
                var AllProducts = []
                while (next) {
                    await page.waitForTimeout(3000);
                    await page.waitForSelector('div.product-item__content')
                    var result = await page.evaluate(async () => {
                        var productUrl = Array.from(document.querySelectorAll('div.product-item__content > h2 > a')).map(element => element.getAttribute('href'));
                        var nextButton = document.querySelector('div.pagination > ul > li.pagination__item--next > a')
                        var next = nextButton ? true : false
                        return { productsInOnePage: productUrl, next };
                    })
                    AllProducts.push(...result.productsInOnePage)
                    next = result.next;
                    if (result.next) {
                        const nextButton = await page.$('div.pagination > ul > li.pagination__item--next > a');
                        nextButton.evaluate((button) => button.click());
                        await page.waitForNavigation({ waitUntil: 'networkidle0' })
                    }
                    result = null

                }
                providerData.products = AllProducts // [...new Set(AllProducts)];
                providerData.products_check = `${providerData.slug.slice(1)}: ${providerData.products.length} producten`
            }

        } catch (error) {
            console.log("Error while fetching provider's product URLs\n", error);
        }
        return providerData;

    } catch (error) {
        const errorUrl = await page.url();
        console.log(`Error in getProviderData in url: ${errorUrl}`, error);
    }
}

module.exports = getProviderData
