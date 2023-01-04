

module.exports = function(mongoose) {

    var SystemSchema = new mongoose.Schema({
        createdAt : {type: Date}, 
        updatedAt : {type: Date},
        lastScrapedAt : {type: Date}
    },{ _id : false })

    var TagData = new mongoose.Schema({
        icon : {type: String}, 
        text : {type: String}
    },{ _id : false })
    
    var ProductData = new mongoose.Schema({
        slug : {type: String},
        name : {type: String},
        tags : [TagData],
        description : {type: String},
        themes : [String],
        images : [String],
        price : {type: String},
        originalPrice : {type: String},
        discountPercentage : {type: String},
        start_dates : [String]
    },{ _id : false })
    
    
    var Product = new mongoose.Schema({
        slug : {type: mongoose.Schema.Types.ObjectId},
        data : ProductData,
        system : SystemSchema
    })

    var Products = mongoose.model('Product',Product)

    var create = async (product) => {

        let productdata = new Products({
            slug: mongoose.Types.ObjectId(),
            data: product,
            system : {
                createdAt : new Date(),
                updatedAt : new Date(),
                lastScrapedAt : new Date()
            }
        })
        return await productdata.save()
    }

    var createorupdate = async (product) =>{
        const doc = await Products.findOne({'data.slug' : product.slug})
        if(doc){
            // Query to update the provider
            doc.data = product,
            doc.system.updatedAt = new Date(),
            doc.system.lastScrapedAt = new Date()
            return await doc.save()
        }
        else{
            // Query to add new Provider
            return await create(product)
        }
    }


    return {
        Product : Product,
        create : create,
        createorupdate : createorupdate
    }
}