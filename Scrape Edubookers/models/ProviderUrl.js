

module.exports = function(mongoose) {

    var SystemSchema = new mongoose.Schema({
        createdAt : {type: Date}, 
        updatedAt : {type: Date},
        lastScrapedAt : {type: Date}
    },{ _id : false })
    
    var ProviderUrlData = new mongoose.Schema({
        url: {type: String}
    },{ _id : false })
    
    
    var ProviderUrl = new mongoose.Schema({
        slug : {type: mongoose.Schema.Types.ObjectId},
        data : ProviderUrlData,
        system : SystemSchema
    })

    var ProviderUrls = mongoose.model('ProviderUrl',ProviderUrl)

    var createorupdate = async (url) =>{
        const doc = await ProviderUrls.findOne({'data.url' : url})
    
        if(doc){
            // Query to update the provider
                doc.data.url = url,
                doc.system.updatedAt = new Date(),
                doc.system.lastScrapedAt = new Date()
                return await doc.save();
            }
        else{
            // Query to add new Provider
            const providerUrlData = new ProviderUrls({
                slug: mongoose.Types.ObjectId(),
                data: {url: url},
                system: {
                    createdAt : new Date(),
                    updatedAt : new Date(),
                    lastScrapedAt : new Date()
                }
            }) 
        
            return await providerUrlData.save();
        }
    }

    var getDocCount = async () => {
        let count = await ProviderUrls.countDocuments();
        return count;
    }

    var getAllUrls = async () => {
        let docs = await ProviderUrls.find({},{'data.url': 1, _id: 0});
        return docs;
    }

    var getLatestUrls = async () => {
        let today = new Date();
        today.setUTCHours(0,0,0,0);
        console.log(today)
        let docs = await ProviderUrls.find({'system.createdAt':{$gt: today}},{'data.url': 1, _id: 0});
        return docs;
    }

    return {
        ProviderUrls : ProviderUrls,
        createorupdate : createorupdate,
        getDocCount : getDocCount,
        getAllUrls : getAllUrls,
        getLatestUrls : getLatestUrls
    }
}