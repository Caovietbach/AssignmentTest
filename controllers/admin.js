const express = require('express')
const async = require('hbs/lib/async')
const {ObjectId} = require('bson')
const router = express.Router()
const {getDB,insertObject,getAccount,getAllDocumentFromCollection,getAnAccount,updateAccount,
    getIdeaFeedback, getAEvent, editEvent, checkUserDepartment,searchIdeaByDepartmentAndEvent,searchDepartmentName,
    checkUserRole,checkUserLogin,updateIdeaLikeCount,getAnIdea,checkCategory, checkUserLike, 
    checkUserDislike,checkUserEmail, checkExistEmail,searchIdeaByCategory, searchIdeaByEvent,searchCoordinator,
    EVENT_TABLE_NAME,USER_TABLE_NAME,IDEA_TABLE_NAME,CATEGORY_TABLE_NAME,ROLE_TABLE_NAME,
    DEPARTMENT_TABLE_NAME,POSTLIKE_TABLE_NAME,POSTDISLIKE_TABLE_NAME,COMMENT_TABLE_NAME} = require('../databaseHandler')

function requiresLoginAdmin(req,res,next){
    if(req.session.user){
        if(req.session.user.role != "Admin"){
            res.redirect('/login');
        }
        return next()
    }else{
        res.redirect('/login')
    }
}



//POST

router.post('/newAccount',requiresLoginAdmin, async (req,res)=>{
    
    const name = req.body.txtName
    const email = req.body.txtEmail
    const role = req.body.Role
    const department = req.body.Department
    const pass= req.body.txtPassword
    const result = await checkExistEmail(email)
    console.log(result)

    if (name.length == 0){
        req.session.error.msg = "An account must have a name"
        res.redirect('/admin/newAccount')
        return
    } else if (email.length == 0){
        req.session.error.msg = "An account must have an email"
        res.redirect('/admin/newAccount')
        return
    } else if (role == 'None'){
        req.session.error.msg = "An account must have a role"
        res.redirect('/admin/newAccount')
        return
    } else if ((role == "Admin" || role == "QAManager") && department != 'None'){
        req.session.error.msg = "Admin or Quality Assurance Manager does not need a department"
        res.redirect('/admin/newAccount')
        return
    } else if ((role == "Staff" || role == "QACoordinator") && department == 'None') {
        req.session.error.msg = "Staff or Quality Assurance Coordinator must have a department"
        res.redirect('/admin/newAccount')
        return
    } else if (pass.length == 0){
        req.session.error.msg = "An account must have a password"
        res.redirect('/admin/newAccount')
        return
    } else if (result == -1 ){
        req.session.error.msg = "This email has been used"
        res.redirect('/admin/newAccount')
        return
    }
    else {
        const objectToInsert = {
            'userName': name,
            'email': email,
            'role': role,
            'department': department,
            'password': pass
        }
        insertObject(USER_TABLE_NAME,objectToInsert)
        res.redirect('/admin/viewAccount')
    }
    
})

router.post('/doUpdateAccount',requiresLoginAdmin, async (req,res)=>{
    var id = req.body.id;
    var objectId = ObjectId(id)
    const username = req.body.txtUsername
    const password = req.body.txtPassword
    const email = req.body.txtEmail
    const role = req.body.Role
    const department = req.body.txtDepartment
    var account = {
        'userName': username,
        'email': email,
        'role': role,
        'department': department,
        'password': password
    } 

    if (username.length == 0){
        req.session.error.msg = "An account must have a name"
        res.redirect('/admin/doUpdateAccount')
        return
    } else if (email.length == 0){
        req.session.error.msg = "An account must have an email"
        res.redirect('/admin/doUpdateAccount')
        return
    } else if (role == 'None'){
        req.session.error.msg = "An account must have a role"
        res.redirect('/admin/doUpdateAccount')
        return
    } else if ((role == "Admin" | role == "QAManager") & department != 'None'){
        req.session.error.msg = "Admin or Quality Assurance Manager does not need a department"
        res.redirect('/admin/doUpdateAccount')
        return
    } else if ((role == "Staff" | role == "QACoordinator") & department == 'None') {
        req.session.error.msg = "Staff or Quality Assurance Coordinator must have a department"
        res.redirect('/admin/doUpdateAccount')
        return
    } else if (password.length == 0){
        req.session.error.msg = "An account must have a password"
        res.redirect('/admin/doUpdateAccount')
        return
    } else {
        const check = await updateAccount(objectId,account)
        console.log(check)
        res.redirect('/admin/viewAccount')
    }
    
})

router.post('/createEvent',requiresLoginAdmin,async (req,res)=>{
    const name = req.body.txtName
    console.log(name)
    const startDate = req.body.startDate
    console.log(startDate)
    const endDate = req.body.endDate
    console.log(endDate)

    const realtimeDate = new Date()
    console.log(Date(realtimeDate))
    const sDate = new Date(req.body.startDate)
    const eDate = new Date(req.body.endDate)
    if(name.length == 0){
        const errorMessage = "The event must have a name"
        res.render('admin/createEvent',{errorMsg:errorMessage})
    }else if (sDate < realtimeDate){
        const errorMessage = "The event start date is passed"
        res.render('admin/createEvent',{errorMsg:errorMessage})
        console.log("1")
        return;
    } else if(eDate < realtimeDate) {
        const errorMessage = "The event end date is passed"
        res.render('admin/createEvent',{errorMsg:errorMessage})
        console.log("2")
        return;
    } else if (sDate > eDate) {
        const errorMessage = "The event end date is earlier than the start date"
        res.render('admin/createEvent',{errorMsg:errorMessage})
        console.log("3")
        return
    } else {
        var event = {
            'name' : name,
            'startDate' : startDate,
            'endDate' : endDate
        }
        const check = await insertObject(EVENT_TABLE_NAME,event)
        console.log(check)
        res.redirect('/admin/viewEvent')
    }
    
})

router.post('/editEvent', requiresLoginAdmin, async (req,res)=>{
    var id = req.body.id;
    console.log(id)
    const name = req.body.txtName
    const startDate = req.body.StartDate
    const endDate = req.body.EndDate
    
    const realtimeDate = new Date()
    console.log(Date(realtimeDate))
    const sDate = new Date(req.body.startDate)
    const eDate = new Date(req.body.endDate)
    if(name.length == 0){
        req.session.error.msg = "The event must have a name"
        res.redirect('/admin/editEvent')
        return
    }else if (sDate < realtimeDate){
        req.session.error.msg = "The event start date is passed"
        res.redirect('/admin/editEvent')
        return;
    } else if(eDate < realtimeDate) {
        req.session.error.msg = "The event end date is passed"
        res.redirect('/admin/editEvent')
        return;
    } else if (sDate > eDate) {
        req.session.error.msg = "The event end date is earlier than the start date"
        res.redirect('/admin/editEvent')
        return
    } else {
        var event = {
            'name' : name,
            'startDate' : startDate,
            'endDate' : endDate
        }
        var check = await editEvent(id, event)
        console.log(check)
        res.redirect('/admin/viewEvent')
    }
})

router.post('/submitComment',requiresLoginAdmin, async (req,res)=>{
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
    console.log(check)
    res.redirect('/admin/viewIdea')
})

router.post('/viewSort',requiresLoginAdmin, async (req, res)=>{
    const input = req.body.Input
    var checkC = await searchIdeaByCategory(input)
    console.log(checkC)
    var checkE = await searchIdeaByEvent(input)
    console.log(checkE)
    if (checkC.length != 0 && checkE.length == 0){
        console.log(checkC)
        res.render('admin/viewIdea',{ideas:checkC})
        return
    } else if (checkC.length == 0 && checkE.length != 0){
        console.log(checkE)
        res.render('admin/viewIdea',{ideas:checkE})
        return
    } else {
        console.log("None")
        req.session.error.msg = "There are no such category or event"
        res.redirect('/admin/viewIdea')
    }
})




//GET

router.get('/home',requiresLoginAdmin,(req,res)=>{
    res.render('admin/home')
})


////////////////////////////////////////////  ACCOUNT MANAGEMENT ///////////////////////////////////////////////

router.get('/newAccount', requiresLoginAdmin, async(req,res)=>{
    const results = await getAllDocumentFromCollection(ROLE_TABLE_NAME)
    const departments = await getAllDocumentFromCollection(DEPARTMENT_TABLE_NAME)
    if(req.session.error.msg != null){
        var errorMessage = req.session.error.msg
        res.render('admin/newAccount',{'roles':results,'departments':departments, 'errorMsg':errorMessage})
        req.session.error.msg = null
        return
    } else {
        res.render('admin/newAccount',{roles:results,departments:departments})
    }
})

router.get('/updateAccount',requiresLoginAdmin,  async (req,res)=>{
    var id = req.query.id;
    var objectId = ObjectId(id)
    var account = await getAnAccount(objectId);
    const roles = await getAllDocumentFromCollection(ROLE_TABLE_NAME)
    const departments = await getAllDocumentFromCollection(DEPARTMENT_TABLE_NAME)
    console.log(departments)
    res.render('admin/updateAccount',{account:account,roles:roles,departments:departments})
})

router.get('/deleteAccount',requiresLoginAdmin,async (req,res)=>{
    let id = req.query.id
    console.log(id)
    let objectId = ObjectId(id)
    let dbo = await getDB()
    await dbo.collection(USER_TABLE_NAME).deleteOne({_id:objectId})
    res.redirect('/admin/viewAccount')
})

router.get('/viewAccount',requiresLoginAdmin,async (req,res)=>{
    let result = await getAccount()
    res.render('admin/viewAccount',{'accounts': result})
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                                    //++++//

///////////////////////////////////////////////// LIKE ///////////////////////////////////////////////////////////////////////
router.get('/likeIdea',requiresLoginAdmin, async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    const userEmail = req.session.user.email
    const testLike = await checkUserLike(objectId,userEmail)
    const testDislike = await checkUserDislike(objectId,userEmail)
    if (testLike == 1){
        res.redirect('/admin/viewIdea')
    } else if (testDislike == 1){
        const idea = await getAnIdea(objectId)
        console.log("So like hien tai la " + idea.likeCount)
        const count = idea.likeCount
        const newLikeCount = count + 2
        console.log("So like moi se la:" + newLikeCount)
        await updateIdeaLikeCount(objectId,newLikeCount)
        const userThatLike ={
            'ideaID' : objectId,
            'userEmail' : req.session.user.email
        }
        const dbo = await getDB()
        await dbo.collection(POSTDISLIKE_TABLE_NAME).deleteOne({_id: objectId, userEmail: userEmail})
        await insertObject(POSTLIKE_TABLE_NAME,userThatLike)
        console.log("Success")
        res.redirect('/admin/viewIdea')
    } else {
        var idea = await getAnIdea(objectId)
        console.log("So like hien tai la " + idea.likeCount)
        var count = parseInt(idea.likeCount)
        var newLikeCount = count + 1
        console.log("So like moi se la:" + newLikeCount)
        await updateIdeaLikeCount(objectId,newLikeCount)
        const userThatLike ={
            'ideaID' : objectId,
            'userEmail' : req.session.user.email
        }
        console.log(userThatLike)
        await insertObject(POSTLIKE_TABLE_NAME,userThatLike)
        console.log("Success")
        res.redirect('/admin/viewIdea')
    }
})

router.get('/dislikeIdea',requiresLoginAdmin, async (req, res) => {
    const id = req.query.id
    console.log(id)
    const objectId = ObjectId(id)
    const userEmail = req.session.user.email
    console.log(userEmail)
    const testDislike = await checkUserDislike(objectId,userEmail)
    const testLike = await checkUserLike(objectId,userEmail)
    console.log(testDislike)
    console.log(testLike)
    if (testDislike == 1) {
        res.redirect('/admin/viewIdea')
    } else if (testLike == 1){
        var idea = await getAnIdea(objectId)
        console.log("So like hien tai la " + idea.likeCount)
        var count = parseInt(idea.likeCount)
        var newLikeCount = count - 2
        console.log("So like moi se la:" + newLikeCount)
        await updateIdeaLikeCount(objectId,newLikeCount)
        const userThatDislike ={
            'ideaID' : objectId,
            'userEmail' : req.session.user.email
        }
        const dbo = await getDB()
        await dbo.collection(POSTLIKE_TABLE_NAME).deleteOne({_id: objectId, userEmail: userEmail})
        await insertObject(POSTDISLIKE_TABLE_NAME,userThatDislike)
        console.log("Success")
        res.redirect('/admin/viewIdea')
    } else {
        var idea = await getAnIdea(objectId)
        console.log("So like hien tai la: " + idea.likeCount)
        var count = parseInt(idea.likeCount)
        var newLikeCount = count - 1
        console.log("So like moi se la: " + newLikeCount)
        await updateIdeaLikeCount(objectId,newLikeCount)
        const userThatDislike ={
            'ideaID' : objectId,
            'userEmail' : req.session.user.email
        }
        console.log(userThatDislike)
        await insertObject(POSTDISLIKE_TABLE_NAME,userThatDislike)
        console.log("Success")
        res.redirect('/admin/viewIdea')
    }
})

router.get('/viewIdea',requiresLoginAdmin, async(req,res)=>{
    const results = await getAllDocumentFromCollection(IDEA_TABLE_NAME)
    res.render('admin/viewIdea',{'ideas':results})
})

///////////////////////////////////////////////////// COMMENT ////////////////////////////////////////////////////////////////////

router.get('/Idea',requiresLoginAdmin,async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    const result = await getAnIdea(objectId)
    const name = result.idea
    const folderPath = __dirname.replace('\controllers','')+('/uploads/')
    res.sendFile(folderPath + name)
})

router.get('/submitComment', async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    const result = await getAnIdea(objectId)
    res.render('admin/submitComment',{idea: result})
})

router.get('/viewComment',requiresLoginAdmin,async (req,res)=>{
    const id = req.query.id
    console.log(id)
    const result = await getIdeaFeedback(id)
    const objectId = ObjectId(id)
    console.log(objectId)
    const idea = await getAnIdea(objectId)
    res.render('admin/viewComment',{comments:result,idea:idea})
})

///////////////////////////////////////////////////// SET EVENT //////////////////////////////////////////////////////////////

router.get('/createEvent', async (req, res) =>{
    res.render('admin/createEvent')
})


router.get('/editEvent', requiresLoginAdmin,async (req, res) =>{
    var id = req.query.id
    const objectId = ObjectId(id)
    var event = await getAEvent(objectId)
    if(req.session.error.msg != null){
        const errorMsg = req.session.error.msg
        res.render('admin/editEvent',{'event':event,errorMsg: errorMsg})
        req.session.error.msg = null
        return
    } else {
        res.render('admin/editEvent',{'event':event})
    }
})

router.get('/viewEvent',requiresLoginAdmin,async (req, res) =>{
    const results = await getAllDocumentFromCollection(EVENT_TABLE_NAME)
    res.render('admin/viewEvent',{'events':results})
})


module.exports = router;