require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const url = process.env.conn_string;

const functions = {

    getBatData: ()=>{
            return new Promise((resolve, reject) => {
            MongoClient.connect(url, {newUrlParser : true}, (err,db)=>{
                if(err) reject(err) 
                let dbo = db.db("MatchDB");
                dbo.collection("Batting").find().toArray((err,res)=>{
                        let data = res;
                        db.close(); 
                        resolve(data) 
                });
            }) 
        })
    }
}

module.exports = functions;