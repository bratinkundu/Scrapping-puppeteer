const mongoose = require('mongoose');
var SystemSchema = new mongoose.Schema({
    createdAt: { type: Date },
    updatedAt: { type: Date },
    lastScrapedAt: { type: Date }
}, { _id: false })

var ProviderUrlData = new mongoose.Schema({
    url: { type: String }
}, { _id: false })


var ProviderUrl = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId },
    data: ProviderUrlData,
    system: SystemSchema
})


var create = async (providerUrl) => {

    let providerUrlData = new ProviderUrls({
        slug: mongoose.Types.ObjectId(),
        data: providerUrl,
        system: {
            createdAt: new Date(),
            updatedAt: new Date(),
            lastScrapedAt: new Date()
        }
    })

    await providerUrlData.save()
}

var createorupdate = async (providerUrl) => {
    const doc = await ProviderUrls.findOne({ 'data.url': providerUrl.url })
    if (doc) {
        // Query to update the provider
        doc.data = providerUrl
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date()
        return await doc.save()

    }
    else {
        // Query to add new Provider
        return await create(providerUrl)
    }
}

var getDocCount = async () => {
    let count = await ProviderUrls.countDocuments();
    return count;
}

var getAllUrls = async () => {
    let docs = await ProviderUrls.find({}, { 'data.url': 1, _id: 0 });
    return docs;
}

ProviderUrl.methods.create = create
ProviderUrl.methods.createorupdate = createorupdate
ProviderUrl.methods.getDocCount = getDocCount
ProviderUrl.methods.getAllUrls = getAllUrls

var ProviderUrls = mongoose.model('ProviderUrl', ProviderUrl)

module.exports = ProviderUrls