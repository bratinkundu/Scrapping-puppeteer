

module.exports = function(mongoose) {

    var SystemSchema = new mongoose.Schema({
        createdAt : {type: Date}, 
        updatedAt : {type: Date},
        lastScrapedAt : {type: Date}
    },{ _id : false })

    var LessonsData = new mongoose.Schema({
        name : {type: String},
        date : {type: String},
        timeFrom : {type: String},
        timeTill : {type: String}
    },{ _id : false })
    
    var StartDateData = new mongoose.Schema({
        productSlug : {type: String},
        date : {type: String},
        location : {type: String},
        price : {type: String},
        vat : {type: String},
        totalPrice : {type: String},
        lessons : [LessonsData],
        duration : {type: String},
        reviews : [String]
    },{ _id : false })
    
    
    var StartDate = new mongoose.Schema({
        slug : {type: mongoose.Schema.Types.ObjectId},
        data : StartDateData,
        system : SystemSchema
    })

    var StartDates = mongoose.model('StartDate',StartDate)


    var create = async (startdate) => {

        const startdatedata = new StartDates({
            slug : mongoose.Types.ObjectId(),
            data : startdate,
            system : {
                createdAt : new Date(),
                updatedAt : new Date(),
                lastScrapedAt : new Date()
            } 
        })
        return await startdatedata.save()
    }


    var createorupdate = async (startdate) =>{
        const doc = await StartDates.findOne({'data.productSlug' : startdate.productSlug, 'data.date': startdate.date, 'data.location': startdate.location})
        if(doc){
            // Query to update the provider
            doc.data = startdate,
            doc.system.updatedAt = new Date(),
            doc.system.lastScrapedAt = new Date()
            return await doc.save()
        }          
        else{
            // Query to add new Provider
            return await create(startdate)
        }
    }


    return {
        StartDate : StartDate,
        create : create,
        createorupdate : createorupdate
    }
}