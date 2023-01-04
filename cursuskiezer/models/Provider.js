

module.exports = function(mongoose){

    var SystemSchema = new mongoose.Schema({
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date }
    }, { _id: false })
    
    var ProviderData = new mongoose.Schema({
        slug : { type: String },
        url : { type: String },
        provider : { type: String },
        info : { type: String },
        picture : { type: String },
        street : { type: String },
        postalCodePlace : { type: String },
        email : { type: String },
        website: { type: String },
    }, { _id: false })
    
    
    var Provider = new mongoose.Schema({
        slug: { type: mongoose.Schema.Types.ObjectId, },
        data: ProviderData,
        system: SystemSchema
    })

    var Providers = mongoose.model('Provider', Provider)
    
    var create = async (providerObj) => {
    
        let providerData = new Providers({
            slug: mongoose.Types.ObjectId(),
            data: providerObj,
            system: {
                createdAt: new Date(),
                updatedAt: new Date(),
                lastScrapedAt: new Date()
            }
        })
    
        return await providerData.save()
    }
    
    var createorupdate = async (provider) => {
        const doc = await Providers.findOne({ 'data.slug': provider.slug })
        if (doc) {
            // Query to update the provider
            doc.data = provider
            doc.system.updatedAt = new Date()
            doc.system.lastScrapedAt = new Date()
            return await doc.save()
    
        }
        else {
            // Query to add new Provider
            return await create(provider)
        }
    }

    return {
        Provider: Provider,
        create : create,
        createorupdate : createorupdate
    }
}
