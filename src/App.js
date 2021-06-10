import express from 'express'
import cors from "cors";

const app = express()
app.use(express.json())
app.use(cors())

const users = []
const messages = []


// REGISTER PARTICIPANT //
app.post("/participants", (req, res) => {
    res.send("OK")
    if(validateRegister(req.body.name)){
        res.sendStatus(400)
    } else {
        req.body.lastStatus = Date.now()
        users.push(req.body)
        const logInMessage = {from: req.body.name, to: 'Todos', text: 'entrou na sala...', type: 'status', time: req.body.lastStatus}
        messages.push(logInMessage)
    }
})






const validateRegister = (registerName) => {
    const nameExists = users.find(user => user.name === registerName)
    const nameEmpty = registerName === 0 ? true : false
    if(nameExists || nameEmpty){
        return true
    }
    return false
}



app.listen(4000, () => {
    console.log("Server listening at port 4000")
})