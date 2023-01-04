module.exports = function (mongoose) {

    var SystemSchema = new mongoose.Schema(
      {
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date },
      },
      { _id: false }
    );
  
    var LevelsData = new mongoose.Schema(
      {
        name: { type: String },
        url: { type: String },
        slug: { type: String },
        description: { type: String },
      },
      { _id: false }
    );
  
    var Level = new mongoose.Schema({
      slug: { type: mongoose.Schema.Types.ObjectId },
      data: LevelsData,
      system: SystemSchema,
    });
  
    var Levels = mongoose.model("Levels", Level);
  
    var create = async (level) => {
      let levelData = new Levels({
        data: level,
        system: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastScrapedAt: new Date(),
        },
      });
      return await levelData.save()
    };
    
  
    var createorupdate = async (level) => {
      let doc = await Levels.findOne({ "data.url":level.url })
      if(doc){
        doc.data = level
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date();
        return await doc.save()
      }
          
      else {
          // Query to add new Provider
          // coach.media = await returnMediaIds(coach);
          return await create(level)
      }
      
    };
  
    return {
      Level: Level,
      create: create,
      createorupdate: createorupdate,
    };
  };
  