

module.exports = function(mongoose) {

    var SystemSchema = new mongoose.Schema({
        createdAt : {type: Date}, 
        updatedAt : {type: Date},
        lastScrapedAt : {type: Date}
    },{ _id : false })
    
    var ProviderData = new mongoose.Schema({
        name : {type: String},
        address : {type: String},
        email : {type: String}
    },{ _id : false })
    
    
    var Provider = new mongoose.Schema({
        slug : {type: mongoose.Schema.Types.ObjectId},
        data : ProviderData,
        system : SystemSchema
    })

    var Providers = mongoose.model('Provider',Provider)


    var create = async (provider) => {

        let providerData = new Providers({
            slug : mongoose.Types.ObjectId(),
            data : provider,
            system : {
                createdAt : new Date(),
                updatedAt : new Date(),
                lastScrapedAt : new Date()
            }
        })
        return await providerData.save()
        
    }

    var getOrganizerId = async (name) => {
        const doc = await Providers.findOne({'data.name' : name})
        if(doc){
            return doc._id
        }
        else{
            return ''
        }
    }

    var createorupdate = async (provider) =>{
        const doc = await Providers.findOne({'data.name' : provider.name})

        if(doc){
                // Query to update the provider
                doc.data = provider
                doc.system.updatedAt = new Date(),
                doc.system.lastScrapedAt = new Date()
                return await doc.save()
            }
            else{
                // Query to add new Provider
                return await create(provider)
            }
    }


    return {
        Provider : Provider,
        create : create,
        createorupdate : createorupdate,
        getOrganizerId : getOrganizerId
    }
}