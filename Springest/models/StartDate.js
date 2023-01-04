const mongoose = require('mongoose');

var SystemSchema = new mongoose.Schema({
    createdAt: { type: Date },
    updatedAt: { type: Date },
    lastScrapedAt: { type: Date }
}, { _id: false })

var LessonsData = new mongoose.Schema({
    name: { type: String },
    date: { type: String },
    timeFrom: { type: String },
    timeTill: { type: String }
}, { _id: false })

var StartDateData = new mongoose.Schema({
    productSlug: { type: String },
    date: { type: String },
    location: { type: String },
    lessons: [LessonsData],
}, { _id: false })


var StartDate = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId },
    data: StartDateData,
    system: SystemSchema
})

var create = async (startdate) => {

    const startdatedata = new StartDates({
        slug: mongoose.Types.ObjectId(),
        data: startdate,
        system: {
            createdAt: new Date(),
            updatedAt: new Date(),
            lastScrapedAt: new Date()
        }
    })
    return await startdatedata.save()
}


var createorupdate = async (startdate) => {
    const doc = await StartDates.findOne({ 
        'data.productSlug': startdate.productSlug, 
        'data.date': startdate.date
    })
    if (doc) {
        // Query to update the provider
        doc.data = startdate
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date()
        return await doc.save()
    }
    else {
        // Query to add new startdate
        return await create(startdate)
    }
}

StartDate.methods.create = create
StartDate.methods.createorupdate = createorupdate
var StartDates = mongoose.model('StartDate', StartDate)

module.exports = StartDates
