

module.exports = function(mongoose){

    var SystemSchema = new mongoose.Schema({
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date }
    }, { _id: false })
    
    var TrainingData = new mongoose.Schema({
        provider : {type: String},
        latitude : {type: String},
        longitude : {type: String},
        city : {type: String},
        street : {type: String},
        postalCodePlace : {type: String},
        trainingUrl : {type: String},
        startDate : {type: String}
    }, { _id: false })
    
    
    var Training = new mongoose.Schema({
        slug: { type: mongoose.Schema.Types.ObjectId, },
        data: TrainingData,
        system: SystemSchema
    })

    var Trainings = mongoose.model('Training', Training)
    
    var create = async (trainingObj) => {
    
        let trainingData = new Trainings({
            slug: mongoose.Types.ObjectId(),
            data: trainingObj,
            system: {
                createdAt: new Date(),
                updatedAt: new Date(),
                lastScrapedAt: new Date()
            }
        })
    
        return await trainingData.save()
    }
    
    var createorupdate = async (training) => {
        const doc = await Trainings.findOne({ 'data.trainingUrl': training.trainingUrl })
        if (doc) {
            // Query to update the provider
            doc.data = training
            doc.system.updatedAt = new Date()
            doc.system.lastScrapedAt = new Date()
            return await doc.save()
    
        }
        else {
            // Query to add new Provider
            return await create(training)
        }
    }

    return {
        Training: Training,
        create : create,
        createorupdate : createorupdate
    }
}


