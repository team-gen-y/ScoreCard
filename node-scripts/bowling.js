require('dotenv').config();
const router = require('express').Router();
const MongoClient = require('mongodb').MongoClient;
const url = process.env.conn_string;

const bowling = {

    getBowlData : ()=>{
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
              if(err) reject(err) 
              let dbo = db.db("MatchDB");
              dbo.collection("Bowling").find().toArray((err,res)=>{
                      let data = res;
                      db.close(); 
                      resolve(data) 
              });
            }) 
        })
    },

    addNewBowl : (name)=> {
      return new Promise((resolve,reject)=> {
          MongoClient.connect(url, {useNewUrlParser:true}, (err,db)=>{
            if(err) reject (err);
            let dbo = db.db("MatchDB");
            let query = {name:""};
            let newValue = {$set: {name:name}};
            dbo.collection("Bowling").updateOne(query, newValue, (err,res)=>{
                    if(err) throw err;
                    db.close();
                    resolve("Added new Bowler");
            });
        })
      })
    },

    formatBowlData : (bowlData)=>{
        let formattedData = [];
        bowlData.forEach(item=>{
        let obj = {
            num: item['num'],
            name: item['name'],
            overs: item['overs'],
            maidens: item["maidens"],
            runs: item['runs'],
            wickets: item["wickets"],
            economy: item['economy'],
            };
        formattedData.push(obj);
        })
        return(formattedData);
    },

    changeBowler : (newBowler)=>{
        return new Promise((resolve,reject)=>{
            MongoClient.connect(url, async(err,db)=>{
                if(err) reject(err);
                var dbo = db.db("MatchDB");
    
                  function getNum(){
                  return new Promise((res1,rej1)=>{
                    let query = {name:newBowler}
                    dbo.collection("Bowling").findOne(query, (dbErr,data)=>{
                      if(dbErr) rej1 (dbErr)
                      res1(data['num']);
                      })
                    })
                  }
    
                let newBowlerNum = await getNum();
                let query = {detail:"currBowlerData"};
                let newValue = {$set:{currBowler: newBowlerNum-1}};
                dbo.collection("Variables").updateOne(query, newValue, (err,res)=>{
                  db.close();
                  resolve("bowlerUpdated promise resolve!");
                })
            })
        })
      },

    updateWicket: (howOut)=>{
      return new Promise((resolve,reject)=>{
        MongoClient.connect(url, {useNewUrlParser:true}, async(err,db)=>{
          let dbo = db.db("MatchDB");
          let currBowler = await getCurrBowler();
          let wickets = await getBowlerData(currBowler);

          let query = {num: currBowler+1}
          let newValue = {$set:{
              wickets: wickets+1
            }
          }

          dbo.collection('Bowling').updateOne(query, newValue, (dbErr,data)=>{
            if(dbErr) throw dbErr;
            console.log(data);
          })
           
          function getCurrBowler(){
            return new Promise((res1,rej1)=>{
              let query = {detail: "currBowlerData"};
              dbo.collection("Variables").findOne(query, (e,r)=>{
                if(e) reje(e);
                res1(r['currBowler']);
              })
            })
          }

          function getBowlerData(currBowlerNum){
            return new Promise((res2,rej2)=>{
              let query = {num: currBowlerNum+1}
              dbo.collection("Bowling").findOne(query, (dbErr,data)=>{
                if(dbErr) rej2 (dbErr);
                console.log("fkfkfkfkfkfkfkf");
                console.log(data['wickets']);
                res2(data['wickets']);
              })
            })
          }

          
        })
      }) 
    },
  
    updateBowlerData : (run,extra)=>{
        return new Promise((resolve,reject)=>{
            MongoClient.connect(url, async(err,db)=>{
              if(err) reject(err);  
              var dbo = db.db("MatchDB");
    
              function getCurrBowler(){
                return new Promise((res1,rej1)=>{
                  let query = {detail: "currBowlerData"};
                  dbo.collection("Variables").findOne(query, (e,r)=>{
                    if(e) reje(e);
                    res1(r['currBowler']);
                  })
                })
              }

              function getBowlerData(currBowler){
                return new Promise((res2,rej2)=>{
                  let query = {num: currBowler+1}
                  dbo.collection("Bowling").findOne(query, (dbErr,data)=>{
                    if(dbErr) rej2 (dbErr);
                    res2( [data['runs'], data['balls']] );
                  })
                })
              }
    
    
              let currBowler = await getCurrBowler();
              let bowlerData = await getBowlerData(currBowler);
              
              let tempBallsBowled = bowlerData[1]+1;
              let overs = parseInt(tempBallsBowled/6) + "." + parseInt(tempBallsBowled%6);
              let eco = parseFloat((bowlerData[0]+run)/parseFloat(overs)).toFixed(2);
      
              let newBalls;
              if(extra =='wide' || extra == 'no'){
                newBalls = bowlerData[1];
                console.log("waaasdad");
              }
              else
                newBalls = bowlerData[1]+1;

              let newQuery = {num: currBowler+1};
              let newValue = {$set:{
                overs: overs,
                runs: bowlerData[0] + run,
                balls: newBalls,
                economy: eco
              }};
              dbo.collection("Bowling").updateOne(newQuery, newValue, (dbErr,data)=>{
                if(dbErr) throw dbErr ;
                db.close();
                resolve("Dunnit!");
              })
            })
        })
    }
}

module.exports = bowling;