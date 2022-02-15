const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try{
        const Client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser : true})
        const db = Client.db('my-blog');
        
        operations(db);
       
        Client.close();
    }
    catch(error){
        res.send(500).json({message : 'Error connection to db', error});
    }
}
//router parameter

app.get('/api/articles/:name', async  (req, res) => {
    
    withDB(async (db) => {
        const articleName = req.params.name;
        
        const articleInfo = await db.collection('articles').findOne( {name : articleName})
        res.status(200).json(articleInfo);
    }, res)
}) 


//Handling post request

app.post("/api/articles/:name/upvote", (req, res) => {
    
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name : articleName}, {
            '$set' :  {
                upvotes : articleInfo.upvotes + 1
            }
        })
        const updateArticleInfo = await db.collection('articles').updateOne({ name : articleName});
        res.status(200).json(updateArticleInfo);
    }, res)
})

app.post("/api/articles/:name/add-comment", (req, res) => {
    const {username, text} = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name : articleName},{
            '$set' : {
                comments : articleInfo.comments.concat({username , text})
            },
        });
        const updateArticleInfo = await db.collection('articles').updateOne({name : articleName});
        res.status(200).json(updateArticleInfo);
    }, res)
    
})

app.get('*', (req, res)=>{
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log("listening on port 8000"));