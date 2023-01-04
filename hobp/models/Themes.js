module.exports = function (mongoose) {

    var SystemSchema = new mongoose.Schema(
      {
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date },
      },
      { _id: false }
    );
  
    var ThemesData = new mongoose.Schema(
      {
        name: { type: String },
        url: { type: String },
        description: { type: String },
        slug: { type: String },
        logo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
      },
      { _id: false }
    );
  
    var Theme = new mongoose.Schema({
      slug: { type: mongoose.Schema.Types.ObjectId },
      data: ThemesData,
      system: SystemSchema,
    });
  
    var Themes = mongoose.model("Themes", Theme);
  
    var create = async (theme) => {
      let themeData = new Themes({
        data: theme,
        system: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastScrapedAt: new Date(),
        },
      });
      return await themeData.save()
    };
    
  
    var createorupdate = async (theme) => {
      let doc = await Themes.findOne({ "data.url": theme.url })
      if(doc){
        doc.data = theme
        doc.system.updatedAt = new Date()
        doc.system.lastScrapedAt = new Date();
        return await doc.save()
      }
          
      else {
          // Query to add new Provider
          // coach.media = await returnMediaIds(coach);
          return await create(theme)
      }
      
    };
  
    return {
      Theme: Theme,
      create: create,
      createorupdate: createorupdate,
    };
  };
  