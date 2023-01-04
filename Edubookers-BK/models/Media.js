

module.exports = function(mongoose){

    var SystemSchema = new mongoose.Schema({
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date }
    }, { _id: false })
    
    var MediaData = new mongoose.Schema({
        url: { type: String },
        mimeType: { type: String },
        base64Data: {type: String},
    }, { _id: false })
    
    
    var Media = new mongoose.Schema({
        slug: { type: mongoose.Schema.Types.ObjectId, },
        data: MediaData,
        system: SystemSchema
    })

    var Medias = mongoose.model('Media', Media)
    
    var create = async (mediaObj) => {
    
        let mediaData = new Medias({
            slug: mongoose.Types.ObjectId(),
            data: mediaObj,
            system: {
                createdAt: new Date(),
                updatedAt: new Date(),
                lastScrapedAt: new Date()
            }
        })
    
        return await mediaData.save()
    }
    
    var createorupdate = async (media) => {
        const doc = await Medias.findOne({ 'data.url': media.url })
        if (doc) {
            // Query to update the provider
            doc.data = media
            doc.system.updatedAt = new Date()
            doc.system.lastScrapedAt = new Date()
            return await doc.save()
    
        }
        else {
            // Query to add new Provider
            return await create(media)
        }
    }

    return {
        Media: Media,
        create : create,
        createorupdate : createorupdate
    }
}


