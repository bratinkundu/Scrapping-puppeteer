module.exports = function (mongoose) {

    var SystemSchema = new mongoose.Schema(
      {
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date },
      },
      { _id: false }
    );
  
    var CompentenciesData = new mongoose.Schema(
      {
        name: { type: String },
        url: { type: String },
        slug: { type: String },
        description: { type: String },
      },
      { _id: false }
    );
  
    var Compentency = new mongoose.Schema({
      slug: { type: mongoose.Schema.Types.ObjectId },
      data: CompentenciesData,
      system: SystemSchema,
    });
  
    var Compentencies = mongoose.model("Compentencies", Compentency);
  
    var create = async (compentency) => {
      let compentencyData = new Compentencies({
        data: compentency,
        system: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastScrapedAt: new Date(),
        },
      });
      return await compentencyData.save()
    };
    
  
    var createorupdate = async (compentency) => {
      let doc = await Compentencies.findOne({ "data.url": compentency.url })
      if(doc){
        doc.data = compentency
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date();
        return await doc.save()
      }
          
      else {
          // Query to add new Provider
          // coach.media = await returnMediaIds(coach);
          return await create(compentency)
      }
      
    };
  
    return {
      Compentency: Compentency,
      create: create,
      createorupdate: createorupdate,
    };
  };
  