const mongoose = require('mongoose');

var SystemSchema = new mongoose.Schema({
    createdAt: { type: Date },
    updatedAt: { type: Date },
    lastScrapedAt: { type: Date }
}, { _id: false })

var ProductData = new mongoose.Schema({
    slug: { type: String },
    name: { type: String },
    level: { type: String },
    duration: { type: String },
    location: { type: String },
    language: { type: String },
    places: { type: String },
    time: { type: String },
    certificate: { type: String },
    type_product: { type: String },
    description: { type: String },
    themes: [String],
    media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    price_ex_vat: { type: Number },
    price_complete: { type: Boolean },
    vat: { type: Number },
    price_in_vat: { type: Number },
    max_participants: { type: String },
    day_part: { type: String },
    quality_marks: [String],
    startDates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StartDate' }],
    reviewScore: { type: Number },
    reviewCount: { type: Number },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
}, { _id: false })


var Product = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId },
    data: ProductData,
    system: SystemSchema,
})


var create = async (product) => {

    let productdata = new Products({
        slug: mongoose.Types.ObjectId(),
        data: product,
        system: {
            createdAt: new Date(),
            updatedAt: new Date(),
            lastScrapedAt: new Date()
        }
    })
    await productdata.save()
}

var createorupdate = async (product) => {
    const doc = await Products.findOne({ 'data.slug': product.slug })
    if (doc) {
        // Query to update the product
        doc.data = product
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date()
        return await doc.save()
    }
    else {
        // Query to add new product
        return await create(product)
    }
}

Product.methods.create = create
Product.methods.createorupdate = createorupdate

var Products = mongoose.model('Product', Product)

module.exports = Products