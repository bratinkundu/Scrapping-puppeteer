const mongoose = require('mongoose');

var SystemSchema = new mongoose.Schema({
    createdAt: { type: Date },
    updatedAt: { type: Date },
    lastScrapedAt: { type: Date }
}, { _id: false })

var QuestionAnswerData = new mongoose.Schema({
    slug: { type: String },
    posted_by: { type: String },
    description: { type: String },
    themes: [String],
    answers: [{
        by_name: { type: String },
        by_provider: { type: String },
        by_slug: { type: String },
        text: { type: String },
        date: { type: String },
        advised_slug: { type: String },
    }]
}, { _id: false })


var QuestionAnswer = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId },
    data: QuestionAnswerData,
    system: SystemSchema
})


var create = async (qa) => {

    let qaData = new QuestionAnswers({
        slug: mongoose.Types.ObjectId(),
        data: qa,
        system: {
            createdAt: new Date(),
            updatedAt: new Date(),
            lastScrapedAt: new Date()
        }
    })
    await qaData.save()
}

var createorupdate = async (qa) => {
    const doc = await QuestionAnswers.findOne({ 'data.slug': qa.slug })
    if (doc) {
        // Query to update the product
        doc.data = qa
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date()
        return await doc.save()
    }
    else {
        // Query to add new product
        return await create(qa)
    }
}

QuestionAnswer.methods.create = create
QuestionAnswer.methods.createorupdate = createorupdate

var QuestionAnswers = mongoose.model('QuestionAnswer', QuestionAnswer)

module.exports = QuestionAnswers