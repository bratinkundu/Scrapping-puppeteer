var getReviewsData = async (page) => {

    var timeStamp = +new Date()
    var allreviews = [];
    var reviews = []
    var slug = ''
    try {

        var next = true
        slug = await page.evaluate( async () => {
            var moreReviewButton = document.querySelector('div.profile__tabs > div > div.tabs__wrapper > ul > li:nth-child(3) > a')
            if (moreReviewButton) {
                await moreReviewButton.click();
            }
            return window.location.pathname
        })
        while (next) {
            try {
                await new Promise(function (resolve) {
                    setTimeout(resolve, 3000)
                });
                var [reviews, next] = await page.evaluate(async (slug) => {
                    var nextButton = true
                    var AllReviews = document.querySelectorAll('#ervaringen > div.review-items--institute > div.review-item')
                    const result = []
                    AllReviews.forEach((element) => {
                        console.log('element: ', element);
                        var descriptionElement = element.querySelector('div.review-item__content > div.review-item__description')
                        console.log('descriptionElement: ', descriptionElement);
                        var date = descriptionElement.querySelector('abbr')
                        date = date ? date.getAttribute('datetime') : ''
                        console.log(date);
                        var description = descriptionElement.textContent.trim()
                        var descriptionArr = description.split('-');
                        descriptionArr.pop()
                        var description = descriptionArr.join(' ');
                        console.log(description);
                        var rating = element.querySelector('div.review-item__grade > span.rating-score')
                        rating = rating ? Number(rating.textContent.replace('.', '').replace(',', '.').trim()) : null
                        var name = element.querySelector('div.review-item__member-details > strong.member-name')
                        name = name ? name.textContent.trim() : null
                        var functions =  element.querySelector('.review-item__job-title') 
                        functions = functions ? functions.textContent.trim() : ""
                        var review = {
                            providerSlug: slug,
                            productSlug: "",
                            date: date,
                            text: description,
                            rating: rating,
                            name: name,
                            functions: functions
                        }
                        result.push(review)
                    })
                    if (!document.querySelector('.pagination__item--next > a')) {
                        nextButton = false
                    }
                    return [result, nextButton]
                }, slug)
                allreviews = [...allreviews, ...reviews]
                if (next) {
                    await page.click('.pagination__item--next > a').catch(err => {
                        // console.log(err.message);
                    })
                } else {
                    // console.log('No more reviews annd breaking the loop');
                    break
                }

            } catch (error) {
                console.log(`Error while fetching Reviews from provider: ${slug}:\n`, error);
            }
        }
        return allreviews;

    } catch (error) {
        console.log(`Error while fetching Reviews from provider: ${slug} and closing the function:\n`, error);
        return []
    }
}

module.exports = getReviewsData