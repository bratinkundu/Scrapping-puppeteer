module.exports = function (mongoose) {
     
    var SystemSchema = new mongoose.Schema(
      {
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date },
      },
      { _id: false }
    );
  
    var MediaData = new mongoose.Schema(
      {
        url: { type: String },
        mime_type: { type: String },
        slug: { type: String },
        mediaType: { type: String },
        base64Data: { type: String },
      },
      { _id: false }
    );
  
    var Media = new mongoose.Schema({
      slug: { type: mongoose.Schema.Types.ObjectId },
      data: MediaData,
      system: SystemSchema,
    });
  
    var Medias = mongoose.model("Media", Media);
  
    var create = async (imageData) => {
      let coachData = new Medias({
        data: imageData,
        system: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastScrapedAt: new Date(),
        },
      });
      return await coachData.save()
    };
    
  
    var createorupdate = async (imageData) => {
      let doc = await Medias.findOne({'data.url': imageData.url})

      if(doc){
          doc.data = imageData;
          doc.system.updatedAt = new Date()
          doc.system.lastScrapedAt = new Date()
          return await doc.save()
      }
      else{
        return await create(imageData)
      }
    };
  
    return {
      Media: Media,
      create: create,
      createorupdate: createorupdate,
    };
  };
  