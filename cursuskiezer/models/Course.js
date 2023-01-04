

module.exports = function(mongoose){

    var SystemSchema = new mongoose.Schema({
        createdAt: { type: Date },
        updatedAt: { type: Date },
        lastScrapedAt: { type: Date }
    }, { _id: false })
    
    var CourseData = new mongoose.Schema({
        slug : {type: String},
        title : {type: String},
        picture : {type: String}
    }, { _id: false })
    
    
    var Course = new mongoose.Schema({
        slug: { type: mongoose.Schema.Types.ObjectId, },
        data: CourseData,
        system: SystemSchema
    })

    var Courses = mongoose.model('Course', Course)
    
    var create = async (courseObj) => {
    
        let courseData = new Courses({
            slug: mongoose.Types.ObjectId(),
            data: courseObj,
            system: {
                createdAt: new Date(),
                updatedAt: new Date(),
                lastScrapedAt: new Date()
            }
        })
    
        return await courseData.save()
    }
    
    var createorupdate = async (course) => {
        const doc = await Courses.findOne({ 'data.slug': course.slug })
        if (doc) {
            // Query to update the provider
            doc.data = course
            doc.system.updatedAt = new Date()
            doc.system.lastScrapedAt = new Date()
            return await doc.save()
    
        }
        else {
            // Query to add new Provider
            return await create(course)
        }
    }

    return {
        Course: Course,
        create : create,
        createorupdate : createorupdate
    }
}


