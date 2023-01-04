

module.exports = function(mongoose) {

    var SystemSchema = new mongoose.Schema({
        createdAt : {type: Date}, 
        updatedAt : {type: Date},
        lastScrapedAt : {type: Date}
    },{ _id : false })
    
    var CourseData = new mongoose.Schema({
        slug : {type : String},
        title : {type : String},
        sku : {type : String},
        picture : {type : mongoose.Schema.Types.ObjectId},
        courseDuration : {type : String},
        courseParticipants : {type : String},
        price : {type : String},
        productDetails : [String],
        productOveriew : {type : String},
        productInformation : {type : String},
        faq : [Object],
        productLanguage : {type : String},
        productLearnWhat : {type : String},
        productRepeatCourse : {type : String},
        productHelpWho : {type : String},
        productLearningSkills : {type : String},
        productLearningHow : {type : String}, 
        productCertificate : {type : String},
        productCertificateValid : {type : String},
        productMeets : {type : String},
        ratings : [Object]
    },{ _id : false })
    
    
    var Course = new mongoose.Schema({
        slug : {type: mongoose.Schema.Types.ObjectId},
        data : CourseData,
        system : SystemSchema
    })

    var Courses = mongoose.model('Course',Course)


    var create = async (course) => {

        let courseData = new Courses({
            slug : mongoose.Types.ObjectId(),
            data : course,
            system : {
                createdAt : new Date(),
                updatedAt : new Date(),
                lastScrapedAt : new Date()
            }
        })
        return await courseData.save()
        
    }

    var createorupdate = async (course) =>{
        const doc = await Courses.findOne({'data.slug' : course.slug})
            if(doc){
                // Query to update the provider
                doc.data = course
                doc.system.updatedAt = new Date(),
                doc.system.lastScrapedAt = new Date()
                return await doc.save()
            }
            else{
                // Query to add new Provider
                return await create(course)
            }
    }


    return {
        Course : Course,
        create : create,
        createorupdate : createorupdate
    }
}