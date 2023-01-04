module.exports = function (mongoose) {

    var SystemSchema = new mongoose.Schema(
      {
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date },
      },
      { _id: false }
    );
  
    var ProvidersData = new mongoose.Schema(
      {
        name: { type: String },
        url: { type: String },
        slug: { type: String },
        description: { type: String },
      },
      { _id: false }
    );
  
    var Provider = new mongoose.Schema({
      slug: { type: mongoose.Schema.Types.ObjectId },
      data: ProvidersData,
      system: SystemSchema,
    });
  
    var Providers = mongoose.model("Providers", Provider);
  
    var create = async (provider) => {
      let providerData = new Providers({
        data: provider,
        system: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastScrapedAt: new Date(),
        },
      });
      return await providerData.save()
    };
    
    var getProvider = async (providerName) => {
        let doc = await Providers.findOne({ "data.name":providerName })
        return doc;
    }
  
  
    var createorupdate = async (provider) => {
      let doc = await Providers.findOne({ "data.url":provider.url })
      if(doc){
        doc.data = provider
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date();
        return await doc.save()
      }
          
      else {
          // Query to add new Provider
          // coach.media = await returnMediaIds(coach);
          return await create(provider)
      }
      
    };
  
    return {
      Provider: Provider,
      create: create,
      createorupdate: createorupdate,
      getProvider,getProvider
    };
  };
  