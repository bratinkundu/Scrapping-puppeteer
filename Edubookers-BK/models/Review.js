

module.exports = function(mongoose) {

    var SystemSchema = new mongoose.Schema({
        createdAt : {type: Date}, 
        updatedAt : {type: Date},
        lastScrapedAt : {type: Date}
    },{ _id : false })
    
    var ReviewData = new mongoose.Schema({
        providerSlug : {type: String},
        productSlug : {type: String},
        date : {type: String},
        text : {type: String},
        trainingScore : {type: String},
        trainerScore : {type: String},
        recommendation : {type: Boolean},
        name : {type: String},
        function : {type: String}
    },{ _id : false })
    
    
    var Review = new mongoose.Schema({
        slug : {type: mongoose.Schema.Types.ObjectId},
        data : ReviewData,
        system : SystemSchema
    })

    var Reviews = mongoose.model('Review',Review)

    var create = async (review) => {

        const reviewData = new Reviews({
            slug: mongoose.Types.ObjectId(),
            data: review,
            system: {
                createdAt : new Date(),
                updatedAt : new Date(),
                lastScrapedAt : new Date()
            }
        }) 

        return await reviewData.save()
    }

    var createorupdate = async (review) =>{
        let doc = await Reviews.findOne({'data.date': review.date,'data.name': review.name})

        if(doc){
            // Query to update the provider
            doc.data = review,
            doc.system.updatedAt = new Date(),
            doc.system.lastScrapedAt = new Date()
            return await doc.save()
        }
        else{
            // Query to add new Provider
            return await create(review)
        }
            
    }

    return {
        Review : Review,
        create : create,
        createorupdate : createorupdate
    }
}