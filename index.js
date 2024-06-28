const express = require("express")
const path = require("path")
const {open} = require("sqlite")
const sqlite3 = require("sqlite3").verbose()
const bodyParser = require('body-parser')
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
        content:eachGame.content,
        summary:eachGame.summary,
        published_date:eachGame.published_date,
    }
}
app.get("/games",async(request,response)=>{
    const gameQuery = `
    SELECT * FROM games;
    `
    const gameArray = await db.all(gameQuery)
    response.send(gameArray.map(eachGame=> gameList(eachGame)));
})
 app.post("/allGames",async(request,response)=>{
    const {game_name,author,game_image_url,content,summary,published_date} = request.body
    const gameQuery = `INSERT INTO games(game_name,author,game_image_url,content,summary,published_date) 
    VALUES("${game_name}","${author}","${game_image_url}","${content}","${summary}","${published_date}");`
    await db.run(gameQuery)
    const exactQuery = `SELECT * FROM games;`
    const successArray = await db.all(exactQuery)
    response.send(successArray.map(eachGame=> gameList(eachGame)))
 })

 app.put("/update/:id",async(request,response)=>{
    const {game_image_url,game_name,author,content,summary,published_date} = request.body
    const {id} = request.params
    const gameQuery = `UPDATE games SET game_image_url="${game_image_url}",game_name="${game_name}",author="${author}",content="${content}",summary="${summary}",published_date="${published_date}" 
    WHERE id=${id};`
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
  

 module.exports = app