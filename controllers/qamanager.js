const express = require('express')
const async = require('hbs/lib/async')
const fs = require('fs')
const router = express.Router()
const admZip = require('adm-zip')
const path = require('path')
const generateRandomColor = require('generate-random-color')
const {getDB,insertObject,getAccount,getAllDocumentFromCollection,getAnAccount,updateAccount,
    getIdeaFeedback, getAEvent, editEvent, checkUserDepartment,searchIdeaByDepartmentAndEvent,searchDepartmentName,
    checkUserRole,checkUserLogin,updateIdeaLikeCount,getAnIdea,checkCategory, checkUserLike, 
    checkUserDislike,checkUserEmail, checkExistEmail,searchIdeaByCategory, searchIdeaByEvent,searchCoordinator,
    EVENT_TABLE_NAME,USER_TABLE_NAME,IDEA_TABLE_NAME,CATEGORY_TABLE_NAME,ROLE_TABLE_NAME,
    DEPARTMENT_TABLE_NAME,POSTLIKE_TABLE_NAME,POSTDISLIKE_TABLE_NAME,COMMENT_TABLE_NAME} = require('../databaseHandler')
const ObjectsToCsv = require('objects-to-csv')
const {ObjectId} = require('bson')


function requiresLoginQAmanager(req,res,next){
    if(req.session.user){
        if(req.session.user.role != "QAManager"){
            res.redirect('/login');
        }
        return next()
    }else{
        res.redirect('/login')
    }
}



//POST

router.post('/newCategory',requiresLoginQAmanager, async (req, res) => {
    const nameInput = req.body.txtName
    const check = await checkCategory(nameInput)
    if (nameInput.length == 0){
        const errorMessage = "Category must have a name.";
        res.render('qamanager/newCategory',{error:errorMessage})
        console.log("1")
        return;
    } else if (check==1) {
        const errorMessage = "There is already a category like this."
        res.render('qamanager/newCategory',{error:errorMessage})
        console.log("2")
        return;
    }
    else {
        const newC = {"name":nameInput}
        await insertObject(CATEGORY_TABLE_NAME,newC)   
        res.redirect('/qamanager/viewCategory')
    }
})

router.post('/submitComment',requiresLoginQAmanager, async (req,res)=>{
    var id = req.body.id
    console.log(id)
    const user = req.session.user.userName
    const context = req.body.txtComment
    const anon = req.body.Anon
    if (anon == "Yes"){
        var com = {
            'ideaID' : id,
            'user' : "Anonymous",
            'context' : context
        }
    } else {
        var com = {
            'ideaID' : id,
            'user' : user,
            'context' : context
        }
    }
    const check = await insertObject(COMMENT_TABLE_NAME,com)
    res.redirect('/qamanager/viewIdea')
})

router.post('/viewChart',requiresLoginQAmanager, async (req, res) => {
    const choice = req.body.c
    const event = req.body.Event
    const objectId = ObjectId(event)
    var e = await getAEvent(objectId)
    console.log(e.name)
    var department = await searchDepartmentName()
    var departmentData = []
    department.forEach(d =>{
        departmentData.push(d["name"])
    })
    console.log(departmentData)
    var likeData = []
    var ideaData = []
    var color = []
    console.log(event)
    console.log(choice)
    if(choice == "0"){
        req.session.error.msg = "Please select a choice"
        res.redirect('/qamanager/viewChart')
        return
    } 
    //Tong so like cua tung department: Column chart
    else if(choice == "Column" ){
        for (const d in departmentData){
            const a = await searchIdeaByDepartmentAndEvent(departmentData[d],e.name)
            var b = []
            a.forEach(j =>{
                b.push(parseInt(j["likeCount"]))
            })
            console.log(b)
            var sum = 0
            for(const i in a){
                sum = sum + b[i]
            }
            console.log(sum)
            likeData.push(sum)
        }
        console.log(likeData)
        const status = true
        const events = await getAllDocumentFromCollection(EVENT_TABLE_NAME)
        res.render('qamanager/viewChart',{events:events,chart1:status,departments: JSON.stringify(departmentData),likes: likeData})
        return
    }  else if(choice == "Pie" ){
        for (const d in departmentData){
            const a = await searchIdeaByDepartmentAndEvent(departmentData[d],e.name)
            var sum = 0
            a.forEach(i =>{
                sum = sum + 1
            })
            console.log(sum)
            ideaData.push(sum)
            const c = generateRandomColor.rgb()
            console.log(c)
            color.push(c)
        }
        console.log(ideaData)
        const status = true
        const events = await getAllDocumentFromCollection(EVENT_TABLE_NAME)
        res.render('qamanager/viewChart',{events:events,chart2:status,departments: JSON.stringify(departmentData),backgroundColors: JSON.stringify(color),ideas: ideaData})
        return
    }
    else {
        console.log("Error")
    }
})

router.post('/viewSort',requiresLoginQAmanager, async (req, res)=>{
    const input = req.body.Input
    var checkC = await searchIdeaByCategory(input)
    console.log(checkC)
    var checkE = await searchIdeaByEvent(input)
    console.log(checkE)
    if (checkC.length != 0 && checkE.length == 0){
        console.log(checkC)
        res.render('qamanager/viewIdea',{ideas:checkC.reverse()})
        return
    } else if (checkC.length == 0 && checkE.length != 0){
        console.log(checkE)
        res.render('qamanager/viewIdea',{ideas:checkE.reverse()})
        return
    } else {
        console.log("None")
        req.session.error.msg = "There are no such category or event"
        res.redirect('/qamanager/viewIdea')
    }
})

//GET

router.get('/submitComment', requiresLoginQAmanager, async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    const result = await getAnIdea(objectId)
    res.render('qamanager/submitComment',{idea: result})
})

router.get('/home',requiresLoginQAmanager,(req,res)=>{
    res.render('qamanager/home')
})

router.get('/downloadCsv',requiresLoginQAmanager, async (req, res) => {
    const data = await getAllDocumentFromCollection(IDEA_TABLE_NAME)
    const csv = new ObjectsToCsv(data)
    const folderPath = __dirname.replace('\controllers','')+('/downloads/test.csv')
    await csv.toDisk(folderPath)
    res.download(folderPath),() => {
        fs.unlinkSync(folderPath)
    }
    console.log("Download Succeed")
})

router.get('/downloadZip',requiresLoginQAmanager, async (req, res) => {
    const zip = new admZip()
    const folderPath = (__dirname.replace('\controllers','')+ ('/uploads'))
    const out = ('./downloads/data.zip')
    
    fs.readdir(folderPath, (err, files) => {
        if (err)
            console.log(err);
        else {
            files.forEach(file => {
                p = path.join(folderPath, file)
                zip.addLocalFile(p,out)
                fs.writeFileSync(out, zip.toBuffer())
            })
        }
    })
    res.download(out)
})

router.get('/Idea', requiresLoginQAmanager, async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    const result = await getAnIdea(objectId)
    const name = result.idea
    const folderPath = __dirname.replace('\controllers','')+('/uploads/')
    res.sendFile(folderPath + name)
})

router.get('/viewCategory', async(req, res) => {
    const results = await getAllDocumentFromCollection(CATEGORY_TABLE_NAME)
    if(req.session.error.msg != null ){
        const errorMsg = req.session.error.msg
        res.render('qamanager/viewCategory',{category:results,errorMsg:errorMsg})
        req.session.error.msg = null
        return
    } else {
        res.render('qamanager/viewCategory',{category:results})
    }
})
    
    

router.get('/newCategory',requiresLoginQAmanager, async (req, res) => {
    res.render('qamanager/newCategory')
})

router.get('/deleteCategory', async (req, res) => {
    const id = req.query.id
    console.log(id)
    const objectId = ObjectId(id)
    const dbo = await getDB()
    const category = await dbo.collection(CATEGORY_TABLE_NAME).findOne({_id: objectId})
    const result = await searchIdeaByCategory(category.name)
    console.log("___")
    console.log(result.length)
    if (result.length == 0){
        await dbo.collection(CATEGORY_TABLE_NAME).deleteOne({_id:objectId})
        res.redirect('/qamanager/viewCategory')
    } else {
        req.session.error.msg = "This category has been used by some idea(s)."
        res.redirect('/qamanager/viewCategory')
    }
})
router.get('/viewComment', requiresLoginQAmanager,async (req,res)=>{
    const id = req.query.id
    const result = await getIdeaFeedback(id)
    const objectId = ObjectId(id)
    const idea = await getAnIdea(objectId)
    res.render('qamanager/viewComment',{comments:result,idea:idea})
})

router.get('/viewIdea',requiresLoginQAmanager, async (req, res) => {
    const results = await getAllDocumentFromCollection(IDEA_TABLE_NAME)
    if(req.session.error.msg != null){
        const error = req.session.error.msg
        res.render('qamanager/viewIdea',{ideas:results.reverse(),errorMsg: error})
        req.session.error.msg = null
        return
    } else {
        res.render('qamanager/viewIdea',{ideas:results.reverse()})
    }
})

router.get('/viewChart',requiresLoginQAmanager,async (req, res) => {
    const events = await getAllDocumentFromCollection(EVENT_TABLE_NAME)
    if (req.session.error.msg != null){
        const errorMsg = req.session.error.msg
        res.render('qamanager/viewChart',{events: events.reverse(), error: errorMsg})
        req.session.error.msg = null
        return
    } else {
        res.render('qamanager/viewChart',{events: events.reverse()})
    }
})

module.exports = router