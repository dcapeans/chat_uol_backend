import express from 'express'
import cors from "cors";
import dayjs from 'dayjs'
import fs from 'fs'
import {stripHtml} from 'string-strip-html'
import Joi from 'joi'

const app = express()
app.use(express.json())
app.use(cors())

const usersDB = JSON.parse(fs.readFileSync("./src/users.json", "utf-8"))
const messagesDB = JSON.parse(fs.readFileSync("./src/messages.json", "utf-8"))

const userSchema = Joi.object({
    name: Joi.string().required()
})
const messageSchema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    from: Joi.string().required(),
    type: Joi.string(),
    time: Joi.string()
})

// REGISTER PARTICIPANT //
app.post("/participants", (req, res) => {

    if(validateRegister(req.body)){
        res.sendStatus(400)  
    } else {
        req.body.lastStatus = Date.now()
        if(req.body.name !== null || req.body.name !== undefined){
            req.body.name = stripHtml(req.body.name).result.trim()
            usersDB.data.push(req.body)
            const logInMessage = {
                from: req.body.name, 
                to: 'Todos', 
                text: 'entrou na sala...', 
                type: 'status', 
                time: dayjs().format("HH:mm:ss")
            }
            messagesDB.data.push(logInMessage)
            fs.writeFileSync("./src/users.json", JSON.stringify(usersDB))
            fs.writeFileSync("./src/messages.json", JSON.stringify(messagesDB))
            res.sendStatus(200)
        }
    }
})

// GET PARTICIPANTS LIST //
app.get("/participants", (req, res) => {
    res.send(usersDB.data)
})

// SEND MESSAGE //
app.post("/messages", (req, res) => {
    req.body.from = req.header("user")
    req.body.time = dayjs().format("HH:mm:ss")
    req.body.text = stripHtml(req.body.text).result.trim()
    if(validateMessage(req.body)){
        res.sendStatus(400)
    } else {
        messagesDB.data.push(req.body)
        fs.writeFileSync("./src/messages.json", JSON.stringify(messagesDB))
        res.sendStatus(200)
    }
})

// GET MESSAGES //
app.get("/messages", (req, res) => {
    const user = req.header("user")
    const filteredMessages = messagesDB.data.filter((message) => filterMessages(message, user)) 
    const limit = req.query.limit || filteredMessages.length
    res.send(filteredMessages.slice(0, limit))
})

// CHECK STATUS //
app.post("/status", (req, res) => {
    const userName = req.header("user")
    const foundUser = usersDB.data.find(user => user.name === userName)
    if(foundUser){
        foundUser.lastStatus = Date.now()
        res.sendStatus(200)
    } else {
        res.sendStatus(400)
    }
})

// REMOVE INACTIVE USERS //
const checkActivity = () => {
    users = usersDB.data.reduce((acc, current) => {
        if((Date.now() - current.lastStatus) <= 10000){
            acc.push(current)
        } else {
            const logoutMessage = {
                from: current.name, 
                to: 'Todos', 
                text: 'saiu da sala...', 
                type: 'status', 
                time: dayjs().format("HH:mm:ss")
            }
            messagesDB.data.push(logoutMessage)
            fs.writeFileSync("./src/messages.json", JSON.stringify(messagesDB))
        }
        return acc
    }, [])
}

setInterval(checkActivity, 15000)

const validateRegister = (body) => {
    const nameExists = usersDB.data.find(user => user.name === body.name)
    if(userSchema.validate(body).error || (usersDB.data.length > 0 && nameExists)){
        return true
    }
    return false
}

const validateMessage = (body) => {
    const authorExists = usersDB.data.find(user => user.name === body.from)
    if(messageSchema.validate(body).error || !authorExists ){
        return true
    }
    if(body.type !== "message" && body.type !== "private_message"){
        return true
    }
    return false
}

const filterMessages = (message, user) => {
    if(message.type === "status"){
        return true
    }
    if(message.type === "private_message" || message.type === "message"){
        if(message.from === user || message.to === user || message.to === "todos"){
            return true
        }
        return false
    }
    return false
}

app.listen(4000, () => {
    console.log("Server listening at port 4000")
})