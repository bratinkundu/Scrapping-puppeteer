
const mongoose = require('mongoose')

var SystemSchema = new mongoose.Schema({
    createdAt: { type: Date },
    updatedAt: { type: Date },
    lastScrapedAt: { type: Date }
}, { _id: false })

var ProviderData = new mongoose.Schema({
    slug: { type: String },
    name: { type: String },
    address: { type: String },
    postcode: { type: String },
    city: { type: String },
    social_links: [{
        type: { type: String },
        url: { type: String },
    }],
    quality_marks: [String],
    logo: { type: String },
    hero: { type: String },
    description: { type: String },
    media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    trainers: [String],
    products: [String],
    products_check: { type: String },
    reviewScore: { type: String },
    reviewCount: { type: Number },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
}, { _id: false })


var Provider = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId, },
    data: ProviderData,
    system: SystemSchema
})

var create = async (provider) => {

    let providerData = new Providers({
        slug: mongoose.Types.ObjectId(),
        data: provider,
        system: {
            createdAt: new Date(),
            updatedAt: new Date(),
            lastScrapedAt: new Date()
        }
    })

    await providerData.save()
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

Provider.methods.create = create
Provider.methods.createorupdate = createorupdate

var Providers = mongoose.model('Provider', Provider)

module.exports = Providers

