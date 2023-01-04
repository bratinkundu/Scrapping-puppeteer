module.exports = function (mongoose) {
//   var Media = new mongoose.Schema({
//     url: { type: String },
//     mime_type: { type: String },
//     base64Data: { type: String },
//   });

//   var Media = mongoose.model("Media", Media);

  var SystemSchema = new mongoose.Schema(
    {
      createdAt: { type: Date },
      updatedAt: { type: Date },
      lastScrapedAt: { type: Date },
    },
    { _id: false }
  );

  var CoachData = new mongoose.Schema(
    {
      slug: { type: String },
      name: { type: String },
      location: { type: String },
      introduction: { type: String },
      locations: [String],
      types_coaching: [String],
      description: { type: String },
      media: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    },
    { _id: false }
  );

  var Coach = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId },
    data: CoachData,
    system: SystemSchema,
  });

  var Coaches = mongoose.model("Coaching", Coach);

  var returnMediaIds = async (coach_data) => {
    let ids = [];
    if (coach_data.image != "") {
      let data = {
        base64Data: "",
        url: coach_data.image,
        mime_type: "image",
      };
      let doc_id = await createMedia(data);
      ids.push(doc_id);
    }

    return ids;
  };
  var create = async (coach) => {
    let coachData = new Coaches({
      data: coach,
      system: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastScrapedAt: new Date(),
      },
    });
    return await coachData.save()
  };
  

  var createMedia = async (media) => {
    let mediaData = new Media({
      ...media,
    });
    let doc = await mediaData.save();
    return doc._id;
  };

  var deleteMedia = async (id) => {
    await Media.deleteOne({ _id: id });
  };

  var createorupdate = async (coach) => {
    let doc = await Coaches.findOne({ "data.slug": coach.slug })
    if(doc){
      doc.data = coach
      doc.system.updatedAt = new Date()
      doc.system.lastScrapedAt = new Date();
      return await doc.save()
    }
        
    else {
        // Query to add new Provider
        // coach.media = await returnMediaIds(coach);
        return await create(coach)
    }
    
  };

  return {
    Coach: Coach,
    create: create,
    createorupdate: createorupdate,
  };
};
