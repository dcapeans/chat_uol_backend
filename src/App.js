import express from 'express'
import cors from "cors";
import dayjs from 'dayjs'
import {stripHtml} from 'string-strip-html'
import Joi from 'joi'

const app = express()
app.use(express.json())
app.use(cors())

let users = []
const messages = []
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
            users.push(req.body)
            const logInMessage = {
                from: req.body.name, 
                to: 'Todos', 
                text: 'entrou na sala...', 
                type: 'status', 
                time: dayjs().format("HH:mm:ss")
            }
            messages.push(logInMessage)
            res.sendStatus(200)
        }
    }
})

// GET PARTICIPANTS LIST //
app.get("/participants", (req, res) => {
    res.send(users)
})

// SEND MESSAGE //
app.post("/messages", (req, res) => {
    req.body.from = req.header("user")
    req.body.time = dayjs().format("HH:mm:ss")
    req.body.text = stripHtml(req.body.text).result.trim()
    if(validateMessage(req.body)){
        res.sendStatus(400)
    } else {
        messages.push(req.body)
        res.sendStatus(200)
    }
})

// GET MESSAGES //
app.get("/messages", (req, res) => {
    const user = req.header("user")
    const filteredMessages = messages.filter((message) => filterMessages(message, user)) 
    const limit = req.query.limit || filteredMessages.length
    res.send(filteredMessages.slice(0, limit))
})

// CHECK STATUS //
app.post("/status", (req, res) => {
    const userName = req.header("user")
    const foundUser = users.find(user => user.name === userName)
    if(foundUser){
        foundUser.lastStatus = Date.now()
        res.sendStatus(200)
    } else {
        res.sendStatus(400)
    }
})

// REMOVE INACTIVE USERS //
const checkActivity = () => {
    users = users.reduce((acc, current) => {
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
            messages.push(logoutMessage)
        }
        return acc
    }, [])
}

// setInterval(checkActivity, 15000)

const validateRegister = (body) => {
    const nameExists = users.find(user => user.name === body.name)
    if(userSchema.validate(body).error || (users.length > 0 && nameExists)){
        return true
    }
    return false
}

const validateMessage = (body) => {
    const authorExists = users.find(user => user.name === body.from)
    if(messageSchema.validate(body).error || !authorExists ){
        console.log(messageSchema.validate(body).error)
        return true
    }
    if(body.type !== "message" && body.type !== "private_message"){
        console.log("type err")
        return true
    }
    console.log("passou")
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