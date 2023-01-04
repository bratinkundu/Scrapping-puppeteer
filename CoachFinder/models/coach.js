var axios = require("axios");

module.exports = function (mongoose) {

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
      subtitle: [String],
      location: [Object],
      gender: { type: String },
      features: [String],
      topics: [String],
      education: [Object],
      experience: { type: String },
      costs: { type: String },
      media: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
      certificates: [Object],
      website: { type: String },
    },
    { _id: false }
  );

  var Coach = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId },
    data: CoachData,
    system: SystemSchema,
  });

  var Coaches = mongoose.model("Coach", Coach);

  var create = async(coach) => {
    let coachdata = new Coaches({
      data: coach,
      system: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastScrapedAt: new Date(),
      },
    });
    return await coachdata.save();
  };

  var returnMediaIds = async (coach_data) => {
    let ids = [];
    if (coach_data.profile != "") {
      let image = await axios.get(coach_data.profile, {
        responseType: "arraybuffer",
      });

      let raw = Buffer.from(image.data).toString("base64");
      let base64Data =
        "data:" + image.headers["content-type"] + ";base64," + raw;
      let data = {
        base64Data,
        url: coach_data.profile,
        mime_type: "image",
      };
      let doc_id = await createMedia(data);
      ids.push(doc_id);
    }
    if (coach_data.background != "") {
      let image = await axios.get(coach_data.background, {
        responseType: "arraybuffer",
      });

      let raw = Buffer.from(image.data).toString("base64");
      let base64Data =
        "data:" + image.headers["content-type"] + ";base64," + raw;
      let data = {
        base64Data,
        url: coach_data.background,
        mime_type: "image",
      };
      let doc_id = await createMedia(data);
      ids.push(doc_id);
    }

    if (coach_data.video != "") {
      let data = {
        url: coach_data.video,
        mime_type: "video",
        base64Data: "",
      };
      let doc_id = await createMedia(data);
      ids.push(doc_id);
    }
    if (coach_data.audio != "") {
      let data = {
        url: coach_data.audio,
        mime_type: "audio",
        base64Data: "",
      };
      let doc_id = await createMedia(data);
      ids.push(doc_id);
    }

    return ids;
  };

  var createMedia = async (media) => {
    let Mediadata = new Media({
      ...media,
    });
    let doc = await Mediadata.save();
    return doc._id;
  };

  var deleteMedia = async (id) => {
    await Media.deleteOne({ _id: id });
  };

  var createorupdate = async (coach_data) => {
   const doc = await Coaches.findOne({ "data.slug": coach_data.slug });
      if (doc) {
          doc.data = coach_data
          doc.system.updatedAt = new Date();
          doc.system.lastScrapedAt = new Date();
          return await doc.save()
        }
    
       else {
        // coach_data.media = await returnMediaIds(coach_data);
        return await create(coach_data)
      }
  
  };

  return {
    Coach: Coach,
    create: create,
    createorupdate: createorupdate,
  };
};
