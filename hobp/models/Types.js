module.exports = function (mongoose) {

    var SystemSchema = new mongoose.Schema(
      {
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date },
      },
      { _id: false }
    );
  
    var TypesData = new mongoose.Schema(
      {
        name: { type: String },
        url: { type: String },
        description: { type: String },
        slug: { type: String },
      },
      { _id: false }
    );
  
    var Type = new mongoose.Schema({
      slug: { type: mongoose.Schema.Types.ObjectId },
      data: TypesData,
      system: SystemSchema,
    });
  
    var Types = mongoose.model("Types", Type);
  
    var create = async (type) => {
      let typeData = new Types({
        data: type,
        system: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastScrapedAt: new Date(),
        },
      });
      return await typeData.save()
    };
    
  
    var createorupdate = async (type) => {
      let doc = await Types.findOne({ "data.url":type.url })
      if(doc){
        doc.data = type
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date();
        return await doc.save()
      }
          
      else {
          // Query to add new Provider
          // coach.media = await returnMediaIds(coach);
          return await create(type)
      }
      
    };

    var getType = async (typeName) => {
        let doc = await Types.findOne({ "data.name":typeName })
        console.log("doc",typeName)
        return doc;
    }
  
    return {
        Type: Type,
      create: create,
      createorupdate: createorupdate,
      getType:getType
    };
  };
  