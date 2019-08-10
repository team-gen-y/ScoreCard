require('dotenv').config();
const router = require('express').Router();
const MongoClient = require('mongodb').MongoClient;
const url = process.env.conn_string;


getBatData = ()=>{
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
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

getVarData = ()=>{
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
          if(err) reject(err) 
          let dbo = db.db("MatchDB");
          dbo.collection("Variables").find().toArray((err,res)=>{
                  data = res;
                  db.close(); 
                  resolve(data) 
          });
        }) 
    })
}

const variables = {
    getVarData : ()=>{
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
              if(err) reject(err) 
              let dbo = db.db("MatchDB");
              dbo.collection("Variables").find().toArray((err,res)=>{
                      data = res;
                      db.close(); 
                      resolve(data) 
              });
            }) 
        })
    },

    updateCount: (coll,countData)=>{
        return new Promise((resolve,reject)=>{
            MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
                if(err) reject(err);
                let dbo = db.db("MatchDB");
                if(coll == "bat"){
                    let query = {
                      detail: "playersCountData"
                    };
                    let newValue = {$set:{batsmenPlayed: countData + 1}};
                    dbo.collection("Variables").updateOne(query, newValue, (err,res)=>{
                      if(err) throw err;
                    })
                }
                else if(coll == "bowl"){
                    let query = {
                      detail: "playersCountData"
                    };
                    let newValue = {$set:{bowlersPlayed: countData + 1}};
                    dbo.collection("Variables").updateOne(query, newValue, (err,res)=>{
                      if(err) throw err;
                    })
                }
                db.close();
                resolve("updateCount done!");
            })
        })
    },

    updateExtras : (run, extra, extraData)=>{
        return new Promise((resolve,reject)=> {
            MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
                if(err) reject (err);
                let dbo = db.db("MatchDB");
                let query = {detail: "extras"};
                let newValue;
                if(extra == 'bye'){
                newValue = {$set:{byes: extraData['byes'] + run}};
                }
                else if(extra == 'leg-bye'){
                newValue = {$set:{legByes: extraData['legByes'] + run}};
                }
                else if(extra == 'wide'){
                newValue = {$set:{wides: extraData['wides'] + run}};
                }
                else if(extra == 'no'){
                newValue = {$set:{noBalls: extraData['noBalls'] + run}};
                }
                dbo.collection("Variables").updateOne(query, newValue, (dbErr,data)=>{
                if(dbErr) throw dbErr;
                resolve("uE done");
                db.close();
                })
            })
        })
    },

    updateScore : (run)=>{
        return new Promise((resolve,reject)=>{
          MongoClient.connect(url, {useNewUrlParser:true}, async(err,db)=>{
            if(err) reject(err);
            var dbo= db.db("MatchDB");
            let batData = await getBatData();
            let totBatRuns = 0;
            batData.forEach( (item) =>{
              totBatRuns += item['runs'];
            })
      
            let varData = await getVarData();
            let extraRuns = 0;
            for(key in varData[3]){
              if(key != '_id' && key != 'detail'){
                extraRuns += varData[3][key];
               
              }
            }
    
            let totScore = totBatRuns + extraRuns;
            function update(){
              return new Promise( (res1,rej1)=>{
                let query = {detail:"scoreData"};
                let newValue = {$set:{score:totScore}};
                dbo.collection("Variables").updateOne(query, newValue, (dbErr,data)=>{
                  if(dbErr) rej1 (dbErr);
                  res1("updateScore done!")
                  db.close();
                })
              })
            }
    
            await update();
            resolve("final done");
          })
        })
      }  
}

module.exports = variables;