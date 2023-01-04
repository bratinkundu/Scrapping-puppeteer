

module.exports = function(mongoose) {

    var SystemSchema = new mongoose.Schema({
        createdAt : {type: Date}, 
        updatedAt : {type: Date},
        lastScrapedAt : {type: Date}
    },{ _id : false })
    
    var OptionsData = new mongoose.Schema({
        startDate : {type : String},
        startTime :  {type : String},
        availablity : {type : String},
        price : {type : String},
        organizator : {type : String},
        meetingDays : [Object],
        remarks : {type : String},
    },{ _id : false })
    
    
    var Option = new mongoose.Schema({
        slug : {type: mongoose.Schema.Types.ObjectId},
        data : OptionsData,
        system : SystemSchema
    })

    var Options = mongoose.model('Option',Option)


    var create = async (option) => {

        let optionsData = new Options({
            slug : mongoose.Types.ObjectId(),
            data : option,
            system : {
                createdAt : new Date(),
                updatedAt : new Date(),
                lastScrapedAt : new Date()
            }
        })
        return await optionsData.save()
        
    }

    var createorupdate = async (option) =>{
        const doc = await Options.findOne({'data.remarks' : option.remarks, 'data.startDate' : option.startDate})

        if(doc){
                // Query to update the provider
                doc.data = provider
                doc.system.updatedAt = new Date(),
                doc.system.lastScrapedAt = new Date()
                return await doc.save()
            }
            else{
                // Query to add new Provider
                return await create(option)
            }
    }


    return {
        Option : Option,
        create : create,
        createorupdate : createorupdate
    }
}