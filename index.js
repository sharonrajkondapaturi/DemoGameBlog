const express = require("express")
const path = require("path")
const {open} = require("sqlite")
const sqlite3 = require("sqlite3").verbose()
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express();
const dbPath = path.join(__dirname,"projects.db")
const cors = require("cors")
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
let db = null;

const initializeDbAndServer = async()=>{
    try{
        db = await open({
            filename:dbPath,
            driver:sqlite3.Database
        });
        app.listen(4000,()=>{
            console.log(`Server is listening http://localhost:4000`);
        })
    }
    catch(error){
        console.log(`DB error : ${e.message}`)
        process.exit(1)
    }
}

initializeDbAndServer()
const gameList = (eachGame)=>{
    return {
        id:eachGame.id,
        game_name:eachGame.game_name,
        author:eachGame.author,
        game_image_url:eachGame.game_image_url,
        category:eachGame.category,
        content:eachGame.content,
        summary:eachGame.summary,
        published_date:eachGame.published_date,
    }
}

const authenticateToken = (request,response,next)=>{
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if(authHeader !== undefined){
        jwtToken = authHeader.split(" ")[1]
    }
    if(jwtToken === undefined){
        response.status(400)
        response.send("No Access Token")
    }
    else{
        jwt.verify(jwtToken,"shaymiles",async(error,payload)=>{
            if(error){
                response.send("Invalid Access Token")
            }
            else{
                next()
            }
        })
    }
}

app.get("/games/",authenticateToken,async(request,response)=>{
    let gameQuery;
    let gameArray = null;
    const {category='',search=''} = request.query
     gameQuery = `
            SELECT * FROM games WHERE game_name LIKE '%${search}%' AND category LIKE '%${category}%';`
    gameArray = await db.all(gameQuery)
    response.send(gameArray.map(eachGame=> gameList(eachGame)));
})

 app.post("/allGames",async(request,response)=>{
    const {game_name,author,game_image_url,category,content,summary,published_date} = request.body
    const gameQuery = `INSERT INTO games(game_name,author,game_image_url,content,category,summary,published_date) 
    VALUES("${game_name}","${author}","${game_image_url}","${category}","${content}","${summary}","${published_date}");`
    await db.run(gameQuery)
    const exactQuery = `SELECT * FROM games;`
    const successArray = await db.all(exactQuery)
    response.send(successArray.map(eachGame=> gameList(eachGame)))
 })

 app.put("/update/:id",async(request,response)=>{
    const {game_image_url,game_name,author,category,content,summary,published_date} = request.body
    const {id} = request.params
    const gameQuery = `UPDATE games SET game_image_url="${game_image_url}",game_name="${game_name}",author="${author}",content="${content}",summary="${summary}",category="${category}",published_date="${published_date}" 
    WHERE id=${id};`
    await db.run(gameQuery)
    const exactQuery = `SELECT * FROM games;`
    const successArray = await db.all(exactQuery)
    response.send(successArray.map(eachGame=> gameList(eachGame)))
 })

 app.put("/updateOne/:id",async(request,response)=>{
    const {content,category,author} = request.body
    const {id} = request.params
    const gameQuery = `UPDATE games SET category="${category}",content="${content}",author="${author}" WHERE id=${id};`
    await db.run(gameQuery)
    const exactQuery = `SELECT * FROM games;`
    const successArray = await db.all(exactQuery)
    response.send(successArray.map(eachGame=> gameList(eachGame)))
 })

 app.delete("/deleteGame/:id",async(request,response)=>{
    const {id} = request.params
    const gameQuery = `
    DELETE FROM games WHERE id = ${id};`
    await db.run(gameQuery)
    const exactQuery = `SELECT * FROM games;`
    const successArray = await db.all(exactQuery)
    response.send(successArray.map(eachGame=> gameList(eachGame)))
 })

 app.post("/register",async(request,response)=>{
    const {username,password,gender,age} = request.body
    const hashedPassword = await bcrypt.hash(password,10)
    const userQuery = `SELECT * FROM users WHERE username = "${username}";`
    const checkUser = await db.get(userQuery)
    if(checkUser === undefined){
        const newUser = `INSERT INTO users(username,password,gender,age)
        VALUES ("${username}","${hashedPassword}","${gender}","${age}");`
        await db.run(newUser)
        response.send("User created successfully")
    }
    else{
        response.status(400)
        response.send("User already exits")
    }
 })

 app.post("/login",async(request,response)=>{
    const {username,password} = request.body 
    const userQuery = `SELECT * FROM users WHERE username = "${username}";`
    const dbUser = await db.get(userQuery)
    if(dbUser === undefined){
        response.status(400)
        response.send("Invalid user")
    }
    else{
        const isPasswordMatched = await bcrypt.compare(password,dbUser.password)
        if(isPasswordMatched === true){
            const payload = {username:username}
            const jwtToken = jwt.sign(payload,"shaymiles",)
            response.send({jwtToken,username})
        }
        else{
            response.status(400)
            response.send("Invalid password")
        }
    }
 })
  

 module.exports = app