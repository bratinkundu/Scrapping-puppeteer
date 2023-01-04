module.exports = function (mongoose) {

  var SystemSchema = new mongoose.Schema(
    {
      createdAt: { type: Date },
      updatedAt: { type: Date },
      lastScrapedAt: { type: Date },
    },
    { _id: false }
  );

  var TrainingData = new mongoose.Schema(
    {
      slug: { type: String },
      title: { type: String },
      subject: { type: String },
      date: { type: String },
      timeFrom: { type: String },
      timeTill: { type: String },
      duration: { type: String },
      ratings: { type: String },
      level: { type: String },
      certificates: { type: String },
      levelCode: { type: String },
      providerId: { type: String},
      typeId: { type: String},
      reviews: [Object],
      competenciesArray: [String],
      description: { type: String },
      media: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    },
    { _id: false }
  );

  var Training = new mongoose.Schema({
    slug: { type: mongoose.Schema.Types.ObjectId },
    data: TrainingData,
    system: SystemSchema,
  });

  var Trainings = mongoose.model("Trainings", Training);

  var create = async (training) => {
    let trainingData = new Trainings({
      data: training,
      system: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastScrapedAt: new Date(),
      },
    });
    return await trainingData.save()
  };


  var createorupdate = async (training) => {
    console.log("slig",training.title)
    let doc = await Trainings.findOne({ "data.slug": training.slug })
    if(doc){
      doc.data = training
      doc.system.updatedAt = new Date()
      doc.system.lastScrapedAt = new Date();
      return await doc.save()
    }
        
    else {
        // Query to add new Provider
        // coach.media = await returnMediaIds(coach);
        return await create(training)
    }
    
  };

  return {
    Training: Training,
    create: create,
    createorupdate: createorupdate,
  };
};
