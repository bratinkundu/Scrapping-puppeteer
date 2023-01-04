const axios = require("axios").default;

var getProductData = async (page, allProductUrls) => {
    try {
        const baseUrl = await page.evaluate(async () => {
            return window.location.origin
        })
        var productData = []
        for (const productUrl of allProductUrls) {
            try {

                const url = baseUrl + productUrl
                await Promise.all([
                    page.waitForNavigation(),
                    page.goto(url),
                    page.waitForSelector('#overzicht')
                ])
                var product = await page.evaluate(async () => {

                    var name = document.querySelector('h1.content__title.product__title').textContent
                    // main info
                    var productMainInfo = document.querySelector('section.panel > div.product__main-info > dl')
                    var productMainInfoKey = productMainInfo.querySelectorAll('dt')
                    var productMainInfoValue = productMainInfo.querySelectorAll('dd')
                    var level = ''
                    var duration = ''
                    var location = ''

                    for (var i = 0; i < productMainInfoKey.length; i++) {
                        if (!productMainInfoKey[i])
                            continue
                        switch (productMainInfoKey[i].textContent.trim()) {
                            case 'Niveau':
                                level = productMainInfoValue[i] ? productMainInfoValue[i].textContent.trim() : ''
                                break;
                            case 'Tijdsduur':
                                duration = productMainInfoValue[i] ? productMainInfoValue[i].textContent.trim() : ''
                                break;
                            case 'Locatie':
                                location = productMainInfoValue[i] ? productMainInfoValue[i].textContent.trim() : ''
                                break;
                            default:
                                break;
                        }
                    }
                    console.log('level', level);
                    console.log('duration', duration);
                    console.log('location', location);


                    // meta info
                    var language = ''
                    var day_part = ''
                    var max_participants = ''
                    var certificate = ''
                    var type_product = ''
                    var productMetaInfo = document.querySelector('section.panel > aside > div.product__meta-info > dl')
                    var productMetaInfoKey = productMetaInfo.querySelectorAll('dt')
                    var productMetaInfoValue = productMetaInfo.querySelectorAll('dd')
                    for (var i = 0; i < productMetaInfoKey.length; i++) {
                        if (!productMetaInfoKey[i])
                            continue
                        switch (productMetaInfoKey[i].textContent.trim()) {
                            case 'Taal':
                                language = productMetaInfoValue[i] ? productMetaInfoValue[i].textContent.trim() : ''
                                break;
                            case 'Aantal plaatsen':
                                max_participants = productMetaInfoValue[i] ? productMetaInfoValue[i].textContent.trim() : ''
                                break;
                            case 'Tijdstip':
                                day_part = productMetaInfoValue[i] ? productMetaInfoValue[i].textContent.trim() : ''
                                break;
                            case 'Afronding':
                                certificate = productMetaInfoValue[i] ? productMetaInfoValue[i].textContent.trim() : ''
                                break;
                            case 'Type product':
                                type_product = productMetaInfoValue[i] ? productMetaInfoValue[i].textContent.trim() : ''
                                break;
                            default:
                                break;
                        }
                    }
                    console.log('language', language);
                    console.log('max_participants: ', max_participants);
                    console.log('day_part: ', day_part);
                    console.log('certificate: ', certificate);
                    console.log('type_product: ', type_product);
                    document.querySelector('a.arrow-link.tabs__focus-description').click()

                    var description = document.querySelector('#beschrijving > div.product__description')
                    description = description ? description.textContent.trim() : ''
                    console.log('description: ', description);
                    var themeElements = Array.from(document.querySelectorAll('#breadcrumb > div > div.breadcrumb-wrapper.section > ul > li.breadcrumb__item.list-item > a'))
                    if (themeElements.length > 0) {
                        themeElements.pop()
                        themeElements.shift()
                        var themes = themeElements.map(el => el.getAttribute('href'))
                        console.log('themes: ', themes);
                    } else {
                        themeElements = []
                    }
                    var allImages = document.querySelectorAll('.image-gallery > .image-gallery__thumbs > a')
                    var media = []
                    if (allImages && allImages.length) {
                        allImages.forEach(async (el) => {
                            var smallImgUrl = el.href
                            var bigImgUrl = smallImgUrl.replace('small', 'big')
                            .replace('jpeg', 'jpg')
                            .replace('png', 'jpg')
                            .replace('JPG', 'jpg')
                            .replace('JPEG', 'jpg')
                            .replace('PNG', 'jpg')
                            var mimeType = `image/${bigImgUrl.split('.').pop()}`
                            media.push({
                                url: bigImgUrl,
                                mimeType,
                                providerSlug: '/' + window.location.pathname.split('/')[1],
                                productSlug: window.location.pathname
                            })
                            console.log("Got all media")
                        })
                    }
                    var i = 1
                    var ExclVATPriceToggle = document.querySelector('.price-details-toggle')
                    if (ExclVATPriceToggle) {
                        ExclVATPriceToggle.click()
                        if (document.querySelector('i.ma-verified_user')) { i++; }
                        var price_ex_vat = document.querySelector(`div.product__details > div:nth-child(${i++}) > div > span.price`)
                        price_ex_vat = price_ex_vat ? Number(price_ex_vat.textContent.replace('€', '').replace('.', '').replace(',', '.').trim()) : null;
                        console.log('price_ex_vat: ', price_ex_vat);
                        var price_complete = true
                        console.log('price_complete: ', price_complete);
                        const subTotalPrice = document.querySelectorAll('.price-details-table.subtotal .detail-price')
                        console.log('subTotalPrice: ', subTotalPrice);
                        if (subTotalPrice.length > 1) {
                            var vat = subTotalPrice[1] ? Number(subTotalPrice[1].textContent.replace('.', '').replace(',', '.').replace('€', '').trim()) : null
                        }
                        console.log('vat: ', vat);
                    }
                    var priceFreeVatElement = document.querySelector(`div.product__details > div:nth-child(${i}) > div > span.price`)
                    var price_free_vat = null
                    if (priceFreeVatElement) {
                        price_free_vat = priceFreeVatElement ? Number(priceFreeVatElement.textContent.replace('€', '').replace('.', '').replace(',', '.').trim()) : null;
                    }
                    console.log('price_free_vat: ', price_free_vat);
                    var quality_marks = []
                    var logoBoxLinks = document.querySelectorAll('a.logo-box__link')
                    if (logoBoxLinks && logoBoxLinks.length) {
                        logoBoxLinks.forEach((el) => {
                            quality_marks.push(el.getAttribute('href').split('/').pop())
                        })
                    }
                    console.log('quality_marks: ', quality_marks);

                    var startDates = []
                    var startDateTableToggle = document.querySelector('.startdates-table__toggle')
                    var startDateCollection = []
                    if (document.querySelector('#startdata')) {
                        if (startDateTableToggle) {
                            startDateTableToggle.click()
                        }

                        var allStartDates = document.querySelectorAll('table.startdates-table > tbody > tr')
                        // var monthsAbbr = ["jan.", "feb.", "mrt.", "apr.", "mei.", "jun.", "jul.", "aug.", "sep.", "okt.", "nov.", "dec."];
                        var months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
                        allStartDates.forEach((el) => {
                            var schedule = el.querySelectorAll('div.startdates-table__details > div.startdates-table__schedule span')
                            if (schedule && schedule.length) {
                                var startDateObject = { "lessons": [] }
                                schedule.forEach((el) => {
                                    if (!el) { return }
                                    try {

                                        var [dateString, timeString, eventLocation, dayName] = el.textContent.trim().split(',')

                                        var dtArray = dateString.split(' ')
                                        var dtMonth = months.indexOf(dtArray[1]) + 1;
                                        dtMonth = dtMonth < 10 ? '0' + dtMonth : dtMonth
                                        var day = Number(dtArray[0])
                                        day = day < 10 ? '0' + day : day
                                        var date = `${dtArray[2]}-${dtMonth}-${day}`
                                        var location = eventLocation
                                        var name = dayName ? dayName.trim() : ''
                                        var timeFrom = timeString ? timeString.split('-')[0].trim() : null
                                        var timeTill = timeString ? timeString.split('-')[1].trim() : null

                                        startDateObject["lessons"].push({
                                            name: name,
                                            date: date,
                                            timeFrom: timeFrom,
                                            timeTill: timeTill
                                        })
                                        console.log('startDateObject: ', startDateObject)

                                    } catch (error) {
                                        console.log('Not found date string skipping that event:\n ', error)
                                        return
                                    }
                                })
                                if(startDateObject["lessons"].length > 0) {
                                    startDateObject["location"] = el.querySelector('.startdates-table__location > span') ? el.querySelector('.startdates-table__location > span').innerText.trim() : ''
                                    startDateObject["date"] = startDateObject["lessons"][0]["date"]
                                    startDateObject["productSlug"] = window.location.pathname
                                    startDateCollection.push(startDateObject)
                                    console.log(startDateObject)
                                    startDates.push(startDateObject["date"] + '/' + startDateObject["location"])
                                    console.log(startDateObject["date"] + '/' + startDateObject["location"])
                                }
                            }
                        })
                    }
                    console.log('startDates: ', startDates);

                    var reviewScoreElement = document.querySelector('.review-score__square--large')
                    console.log('reviewScoreElement: ', reviewScoreElement);
                    var reviewScore = null
                    var reviewCount = 0
                    var reviews = []
                    if (reviewScoreElement) {
                        reviewScore = Number(reviewScoreElement.textContent
                            .replace('.', '').replace(',', '.').trim())
                        console.log('reviewScore: ', reviewScore);
                        document.querySelector('div.product__tabs > div > div.tabs__wrapper > ul > li:nth-child(3) > a').click()
                        var moreReviewButton = document.querySelector('a.more-reviews')
                        var visible = true
                        while (moreReviewButton && visible) {
                            moreReviewButton.click()
                            await new Promise((res) => setTimeout(res, 1000));
                            moreReviewButton = document.querySelector('a.more-reviews')
                            visible = moreReviewButton.style.display === 'none' ? false : true
                        }
                        var AllReviews = Array.from(document.querySelectorAll('div.review-item'));
                        AllReviews.shift()
                        var slug = window.location.pathname
                        AllReviews.forEach((element) => {
                            var descriptionElement = element.querySelectorAll('div.review-item__content > div.review-item__description > p')
                            var dateElement = descriptionElement[descriptionElement.length - 1].querySelector('abbr')
                            var date = dateElement ? dateElement.getAttribute('datetime') : ''
                            var description = "";
                            descriptionElement.forEach((element) => {
                                description += element.innerText
                            })
                            var descriptionArr = description.split('-');
                            descriptionArr.pop()
                            var description = descriptionArr.join(' ');
                            // console.log(description);
                            var rating = element.querySelector('div.review-item__grade > span.rating-score')
                            rating = rating ? rating.innerText.trim().replace('.', '').replace(',', '.') : null
                            var name = element.querySelector('div.review-item__member-details > strong.member-name')
                            name = name ? name.innerText.trim() : null
                            var functions = element.querySelector('.review-item__job-title')
                            functions = functions ? functions.innerText : ""
                            var review = {
                                providerSlug: '/' + window.location.pathname.split('/')[1],
                                productSlug: slug,
                                date: date,
                                text: description,
                                rating: rating,
                                name: name,
                                functions: functions
                            }
                            console.log(review);
                            reviews.push(review)
                        })
                        reviewCount = reviews.length
                        console.log('reviewCount: ', reviewCount);
                    }
                    console.log('reviews: ', reviews);


                    return {
                        name: name,
                        level,
                        duration,
                        location,
                        language,
                        max_participants,
                        day_part,
                        certificate,
                        type_product,
                        description,
                        themes,
                        media,
                        price_ex_vat,
                        price_complete,
                        vat,
                        price_free_vat,
                        quality_marks,
                        startDates,
                        reviewScore,
                        reviewCount,
                        reviews,
                        eventData: startDateCollection
                    }
                })


                product.slug = productUrl
                for (const media of product.media) {
                    try {
                        let img = await axios.get(media.url, { responseType: 'arraybuffer' })
                        let base64Data = Buffer.from(img.data).toString('base64');
                        media.base64Data = base64Data
                        
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
                        product.media.push({
                            url: frameUrl,
                            mimeType: 'video',
                            productSlug: product.slug,
                            providerSlug: '/' + product.slug.split('/')[1]
                        })
                    } else {
                        // console.log('No video');
                    }
                } catch (error) {
                    console.log('Error getting video: ', error);
                }

                productData.push(product)

            } catch (error) {
                console.log(`Error while fetching a product: ${baseUrl + productUrl}`, error);
            }
        }
        return productData
    } catch (error) {
        console.log('Error in getProductData function and closing the function \n___________________\n', error);
        return []
    }

}

module.exports = getProductData