import express from 'express'
import cors from "cors";
import dayjs from 'dayjs'

const app = express()
app.use(express.json())
app.use(cors())

const users = []
const messages = []


// REGISTER PARTICIPANT //
app.post("/participants", (req, res) => {
    if(validateRegister(req.body.name)){
        res.sendStatus(400)  
    } else {
        req.body.lastStatus = Date.now()
        users.push(req.body)
        const logInMessage = {from: req.body.name, to: 'Todos', text: 'entrou na sala...', type: 'status', time: dayjs().format("HH:mm:ss")}
        messages.push(logInMessage)
        res.sendStatus(200)
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
    if(validateMessage(req.body)){
        res.sendStatus(400)
    } else {
        messages.push(req.body)
        res.sendStatus(200)
    }
})

// GET MESSAGES //
app.get("/messages", (req, res) => {
    console.log("pediu")
    const user = req.header("user")
    const filteredMessages = messages.filter((message) => filterMessages(message, user)) 
    const limit = req.query.limit || filteredMessages.length
    res.send(filteredMessages.slice(0, limit))
})

const validateRegister = (registerName) => {
    const nameExists = users.find(user => user.name === registerName)
    const nameEmpty = registerName === "" ? true : false
    if((users.length > 0 && nameExists) || nameEmpty){
        return true
    }
    
    return false
}

const validateMessage = (body) => {
    if(body.to === "" || body.text === ""){
        return true
    }
    if(body.type !== "message" && body.type !== "private_message"){
        return true
    }
    const authorExists = users.find(user => user.name === body.from)
    if(!authorExists){
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
            console.log("1")
            return true
        }
        console.log("2")
        return false
    }
    console.log("3")
    return false
}

app.listen(4000, () => {
    console.log("Server listening at port 4000")
})