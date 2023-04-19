const express = require('express')
const async = require('hbs/lib/async')
const path = require('path')
const fs = require('fs')
const {ObjectId} = require('bson')
const nodemailer = require('nodemailer')
const multer = require("multer")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/")
    },
    filename: (req, file, cb) => {
        cb(null, req.session.user.email + "-" + file.originalname)
    },
})
const uploadStorage = multer({ storage: storage })
const router = express.Router()
const {getDB,insertObject,getAccount,getAllDocumentFromCollection,getAnAccount,updateAccount,
    getIdeaFeedback, getAEvent, editEvent, checkUserDepartment,searchIdeaByDepartmentAndEvent,searchDepartmentName,
    checkUserRole,checkUserLogin,updateIdeaLikeCount,getAnIdea,checkCategory, checkUserLike, 
    checkUserDislike,checkUserEmail, checkExistEmail,searchIdeaByCategory, searchIdeaByEvent,searchCoordinator,
    EVENT_TABLE_NAME,USER_TABLE_NAME,IDEA_TABLE_NAME,CATEGORY_TABLE_NAME,ROLE_TABLE_NAME,
    DEPARTMENT_TABLE_NAME,POSTLIKE_TABLE_NAME,POSTDISLIKE_TABLE_NAME,COMMENT_TABLE_NAME} = require('../databaseHandler');




function requiresLoginStaff(req,res,next){
    if(req.session.user){
        if(req.session.user.role != "Staff"){
            res.redirect('/login');
        }
        return next()
    }else{
        res.redirect('/login')
    }
}
// POST



router.post('/newIdea',requiresLoginStaff,uploadStorage.single("myFile"), async (req,res)=>{
    req.session.error.msg = null
    const fileName = res.req.file.filename
    console.log(fileName)
    const author = req.session.user.userName
    const authorEmail = req.session.user.email
    const likeCount = 0
    const department = req.session.user.department
    const category = req.body.Category
    const event = req.body.Event
    const eventId = ObjectId(event)
    console.log(event)
    const Anon = req.body.Anon
    const realTime = new Date().getTime() 
    const e = await getAEvent(eventId)
    const eDate = new Date(e.endDate).getTime()

    if (realTime > eDate){
        req.session.error.msg = "The Event has passed, you can't submit to it any more"
        const directoryPath = __dirname.replace('\controllers','')+('/uploads/')
        fs.unlink(directoryPath + fileName, (err) => {
            if (err) {
                throw err;
            }
            console.log("File is taken down.")
        })
        res.redirect('/staff/newIdea')
    } else {
        const ideaName = fileName.replace(authorEmail + "-","").replace(".pdf","")
        const idea = fileName
        if (Anon == "Yes"){
            const objectToInsert = {
                'name': ideaName,
                'idea': idea,
                'author': "Guest",
                'email' : authorEmail,
                'user': author,
                'likeCount':likeCount,
                'category': category,
                'department': department,
                'event': e.name,
                'date': Date(realTime)
            }
            insertObject(IDEA_TABLE_NAME,objectToInsert)
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com", 
                port: 465,
                secure: true,
                auth: {
                    user: 'bachcs48@gmail.com',
                    pass: 'iffpwnrotlhcxtny',
                }
            
            })
            let mailAuthor = {
                from: "bachcs48@gmail.com",
                to: authorEmail,
                subject:"Idea",
                text: "Your idea has been submited successfull."
            }
            transporter.sendMail(mailAuthor, function (err, success){
                if (err) {
                    console.log(err)
                } else {
                    console.log("Successfully send noti to the author!")
                }
            })
            const d = req.session.user.department
            const coor = await searchCoordinator(d)
            var mail = []
            coor.forEach(i =>{
                mail.push(i["email"])
            })
            console.log(mail)
            for( const i in mail ){
                console.log("----")
                console.log(mail[i])
                let mailCoordinator = {
                    from: "bachcs48@gmail.com",
                    to: mail[i],
                    subject:"Idea",
                    text: "A staff from your department has submitted an idea."
                }
    
                transporter.sendMail(mailCoordinator, function (err, success){
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Successfully send noti to the coordinator!")
                    }
                })
            }
            res.redirect('/staff/viewIdea')
            return
        } else {
            const objectToInsert = {
                'name': ideaName,
                'idea': idea,
                'author':author,
                'email' : authorEmail,
                'user': author,
                'likeCount':likeCount,
                'category':category,
                'department': department,
                'event': e.name,
                'date': Date(realTime)
            }
            insertObject(IDEA_TABLE_NAME,objectToInsert)
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com", 
                port: 465,
                secure: true,
                auth: {
                    user: 'bachcs48@gmail.com',
                    pass: 'iffpwnrotlhcxtny',
                }
            
            })
            let mailOptions = {
                from: "bachcs48@gmail.com",
                to: authorEmail,
                subject:"Idea",
                text: "An idea has been submited."
            }
                
            transporter.sendMail(mailOptions, function (err, success){
                if (err) {
                    console.log(err)
                } else {
                    console.log("Sendfile successfull!")
                }
            })
            const d = req.session.user.department
            const coor = await searchCoordinator(d)
            var mail = []
            coor.forEach(i =>{
                mail.push(i["email"])
            })
            console.log(mail)
            for( const i in mail ){
                console.log("----")
                console.log(mail[i])
                let mailCoordinator = {
                    from: "bachcs48@gmail.com",
                    to: mail[i],
                    subject:"Idea",
                    text: "A staff from your department has submitted an idea."
                }
                transporter.sendMail(mailCoordinator, function (err, success){
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Successfully send noti to the coordinator!")
                    }
                })
            }
            res.redirect('/staff/viewIdea')
        }
    }

})




router.post('/submitComment',requiresLoginStaff, async (req,res)=>{
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
    req.session.save(() => {
        res.redirect('/staff/viewIdea')
    })
})

router.post('/viewSort', async (req, res)=>{
    const input = req.body.Input
    var checkC = await searchIdeaByCategory(input)
    console.log(checkC)
    var checkE = await searchIdeaByEvent(input)
    console.log(checkE)
    if (checkC.length != 0 && checkE.length == 0){
        console.log(checkC)
        res.render('staff/viewIdea',{ideas:checkC})
        return
    } else if (checkC.length == 0 && checkE.length != 0){
        console.log(checkE)
        res.render('staff/viewIdea',{ideas:checkE})
        return
    } else {
        console.log("None")
        req.session.error.msg = "There are no such category or event"
        res.redirect('/staff/viewIdea')
    }
})




//GET

router.get('/likeIdea',requiresLoginStaff, async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    var userEmail = req.session.user.email
    const testLike = await checkUserLike(objectId,userEmail)
    const testDislike = await checkUserDislike(objectId,userEmail)
    console.log(testLike)
    console.log(testDislike)
    if (testLike == 1){
        req.session.save(() => {
            res.redirect('/staff/viewIdea')
        })
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
        await dbo.collection(POSTDISLIKE_TABLE_NAME).deleteOne({ideaID: objectId, userEmail: userEmail})
        await insertObject(POSTLIKE_TABLE_NAME,userThatLike)
        console.log("Success")
        req.session.save(() => {
            res.redirect('/staff/viewIdea')
        })
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
        req.session.save(() => {
            res.redirect('/staff/viewIdea')
        })
    }
})

router.get('/dislikeIdea',requiresLoginStaff, async (req, res) => {
    const id = req.query.id
    console.log(id)
    const objectId = ObjectId(id)
    var userEmail = req.session.user.email
    console.log(userEmail)
    const testDislike = await checkUserDislike(objectId,userEmail)
    const testLike = await checkUserLike(objectId,userEmail)
    console.log(testDislike)
    console.log(testLike)
    if (testDislike == 1) {
        req.session.save(() => {
            res.redirect('/staff/viewIdea')
        })
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
        await dbo.collection(POSTLIKE_TABLE_NAME).deleteOne({ideaID: objectId, userEmail: userEmail})
        await insertObject(POSTDISLIKE_TABLE_NAME,userThatDislike)
        console.log("Success")
        req.session.save(() => {
            res.redirect('/staff/viewIdea')
        })
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
        req.session.save(() => {
            res.redirect('/staff/viewIdea')
        })
    }
})

router.get('/Idea', requiresLoginStaff,async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    const result = await getAnIdea(objectId)
    const name = Date(Date.now()) + "-" + result.idea
    const folderPath = __dirname.replace('\controllers','')+('/uploads/')
    res.sendFile(folderPath + name)
})

router.get('/submitComment', requiresLoginStaff, async (req, res) => {
    const id = req.query.id
    const objectId = ObjectId(id)
    const result = await getAnIdea(objectId)
    if (req.session.error.msg != null) {
        var ErrorMessage = req.session.error.msg
    }
    res.render('staff/submitComment',{idea: result, ErrorMessage: ErrorMessage})
    req.session.error.msg = null
})

router.get('/newIdea', requiresLoginStaff, async (req,res)=>{
    const category = await getAllDocumentFromCollection(CATEGORY_TABLE_NAME)
    const event = await getAllDocumentFromCollection(EVENT_TABLE_NAME)
    if(req.session.error.msg != null){
        var ErrorMessage = req.session.error.msg
    }
    res.render('staff/newIdea',{categories:category,events:event,Errormsg:ErrorMessage})
    req.session.error.msg = null
})

router.get('/home', requiresLoginStaff,(req,res)=>{
    res.render('staff/home')
})

router.get('/viewComment', requiresLoginStaff,async (req,res)=>{
    const id = req.query.id
    const result = await getIdeaFeedback(id)
    const objectId = ObjectId(id)
    const idea = await getAnIdea(objectId)
    res.render('staff/viewComment',{comments:result,idea:idea})
})

router.get('/viewIdea',requiresLoginStaff, async (req, res) => {
    const results = await getAllDocumentFromCollection(IDEA_TABLE_NAME)
    if (req.session.error.msg != null){
        const msg = req.session.error.msg
        res.render('staff/viewIdea',{ideas:results.reverse(),ErrorMsg:msg})
        req.session.error.msg = null
        return
    } else {
        res.render('staff/viewIdea',{ideas:results.reverse()})
    }
})





module.exports = router;