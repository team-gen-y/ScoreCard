require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const url = process.env.conn_string;

const batting = {

    getBatData: ()=>{
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
    },

    formatBatData: (batData)=>{
        let formattedData = [];
        batData.forEach(item=>{
          let obj = {
            num: item['num'],
            name: item['name'],
            '6s': item['6s'],
            '5s': item["5s"],
            '4s': item['4s'],
            '3s': item["3s"],
            '2s': item['2s'],
            '1s': item["1s"],
            '0s': item['0s'],
            howOut: item['howOut'],
            runs: item['runs']
          };
          formattedData.push(obj);
        })
        return formattedData;
    },
    
    addNewBat : (name)=> {
      return new Promise((resolve,reject)=> {
          MongoClient.connect(url, {useNewUrlParser:true}, (err,db)=>{
            if(err) reject (err);
            let dbo = db.db("MatchDB");
            let query = {name:""};
            let newValue = {$set: {name:name}};
            dbo.collection("Batting").updateOne(query, newValue, (err,res)=>{
                    if(err) throw err;
                    db.close();
                    resolve("Added new Batsman");
            });
        })
      })
    },

    updateBatsmanData :(run)=>{
      return new Promise((resolve,reject)=>{
        MongoClient.connect(url, async(err,db)=>{
          if(err) reject(err);
          var dbo = db.db("MatchDB");

          function getCurrBatsman(){
            return new Promise((res1,rej1)=>{
                let query = {detail: "strikerData"};
                dbo.collection("Variables").findOne(query, (dbErr,data)=>{
                      if(dbErr) rej1(dbErr);
                      res1 (data['striker']);
                })
            })
          }
          let striker = await getCurrBatsman();
          function strikerRuns(){
            return new Promise((res2,rej2)=>{
                let query = {num: striker+1};
                dbo.collection("Batting").findOne(query, (dbErr,data)=>{
                      if(dbErr) rej2(dbErr);
                      let distri = {
                        name : data['name'],
                        '6s' : data['6s'],
                        '5s' : data['5s'],
                        '4s' : data['4s'],
                        '3s' : data['3s'],
                        '2s' : data['2s'],
                        '1s' : data['1s'],
                        '0s' : data['0s'],
                        'runs': data['runs']
                      }
                      res2(distri);
                })
            })
          }
          let runDistribution = await strikerRuns();
          console.log(runDistribution);
          let newRun = runDistribution;
          newRun['runs']+=run;
          if(run==0){
            newRun['0s']++;
          }else if(run==1){
            newRun['1s']++;
          }else if(run==2){
            newRun['2s']++;
          }else if(run==3){
            newRun['3s']++;
          }else if(run==4){
            newRun['4s']++;
          }else if(run==5){
            newRun['5s']++;
          }else if(run==6){
            newRun['6s']++;
          }

          console.log(newRun);
          
          let query = {num: striker+1};
          let newValue = {
            $set: newRun
          }

          dbo.collection("Batting").updateOne(query, newValue, (errr,ress)=>{
            if(errr) throw errr;
            resolve("Update batsman data resolved");
            db.close();
          })
          
        })
      })
    },

    out : ()=>{
      return new Promise( (resolve,reject)=>{
        MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
          if(err) reject (err);
          var dbo = db.db("MatchDB");
          let query = {detail:'strikerData'};
          let newValue = {$set:{
            striker: 100
          }}
          dbo.collection('Variables').updateOne(query, newValue, (dbErr,data)=>{
            console.log(data);
            db.close();
            resolve("Out Bat Done");
          })
        })
      })
    },

    updateOutData: (batsmanNum,bowlerNum,howOut,fielder)=>{
      return new Promise((resolve,reject)=>{  
        MongoClient.connect(url, {useNewUrlParser:true}, async(err,db)=>{
          if(err) reject (err);
          var dbo = db.db("MatchDB");
          let batNum = await getBatsman(batsmanNum);
          let bowlName = await getBowler(bowlerNum);
          let query = {num: batNum};
          let outMethod = ``;
          let outString = ``;
      
          if(howOut == 'runOut'){
            outString = `Run Out ${fielder}`
          }
          else if(howOut == 'caught')
            outString = `c. ${fielder}`
          else if(howOut == 'bowled')
            outString = ``
          else if(howOut == 'stumped')
            outString = `stumped`
          else if(howOut == 'lbw')
            outString = `lbw`

            
          let newValue;
          if(howOut == 'runOut'){
              newValue = {$set:{
              howOut: `${outString}`
            }}
          }else{
            newValue = {$set:{
            howOut: `${outString} b.${bowlName}`
            }}
          }
          dbo.collection('Batting').updateOne(query, newValue, (dbErr,data)=>{
            resolve("update Out Data done");
          })
        })

        const getBatsman = (batsman)=>{
          return new Promise ((res,rej)=>{
            MongoClient.connect(url, {useNewUrlParser:true}, (err,db)=>{
              if(err) rej(err);

              var dbo = db.db("MatchDB");
              dbo.collection('Batting').find({name: batsman}).toArray((error,result)=>{
                if(error) throw error;
                db.close();
                res(result[0]['num']);
              })
            })
          })
        }

        const getBowler = (bowler)=>{
          return new Promise((res,rej)=>{
            MongoClient.connect(url, {useNewUrlParser: true}, (err,db)=>{
              if(err) rej(err);

              var dbo = db.db("MatchDB");
              dbo.collection('Bowling').find({num: bowler+1}).toArray((error,result)=>{
                if(error) throw error;
                db.close();
                res(result[0]['name']);
              })
            })
          })
        }
      })
    },

    changeStriker: (batsman, striker)=>{
      return new Promise((resolve,reject)=>{
          MongoClient.connect(url, async(err,db)=>{
            if(err) reject(err);
            let dbo = db.db("MatchDB");

            let batNum = await getBatNum(batsman);
            let newValue = {$set:{striker: batNum}};
            dbo.collection('Variables').updateOne({detail:'strikerData'}, newValue, (dbErr,data)=>{
              if(dbErr) throw dbErr;
              console.log(data);
              db.close();
              resolve("Striker change done");
            })

            function getBatNum(batsman){
              return new Promise((res,rej)=>{
                dbo.collection('Batsman').find({name:batsman}).toArray((dbErr,data)=>{
                  if(dbErr) rej(dbErr);
                  console.log(data);
                  res(data['num']);
                })
              })
            }
          })
      })
    },

    switchStrike : (run,currBatsmen)=>{
      return new Promise((resolve,reject)=>{
          MongoClient.connect(url, async(err,db)=>{
              if (err) reject (err);
              var dbo = db.db("MatchDB");

              function swap(){
                return new Promise((res1,rej1)=>{
              
                  let query = {detail: "strikerData"};
                  let temp = currBatsmen[0];
                  let newValue = { $set:{
                    striker : currBatsmen[1],
                    nonStriker: temp
                  }}
                  dbo.collection("Variables").updateOne(query, newValue, (dbErr,result)=>{
                    if(dbErr) rej1(dbErr);
                    res1("done!!!");
                  })
                
                })
              }

              function getCurrBowler(){
                return new Promise((res2,rej2)=>{
                  let query = {detail: "currBowlerData"};
                  dbo.collection("Variables").findOne(query, (e,r)=>{
                    if(e) reje(e);
                    res2(r['currBowler']);
                  })
                })
              }
    
              let currBowler = await getCurrBowler();
              function getBalls(){
                return new Promise((res3,rej3)=>{
                  let query = {num: currBowler+1}
                  dbo.collection("Bowling").findOne(query, (dbErr,data)=>{
                    if(dbErr) rej3 (dbErr);
                    res3(data['balls']);
                  })
                })
              }

              let ballsBowled = await getBalls();

              if(ballsBowled%6==0){
                if(run !=1 && run !=3){
                  console.log("over end swap");
                  await swap();
                
                }
              }
              else if(ballsBowled%6!=0){
                if(run == 1 || run == 3){
                  console.log("mid over swap");
                  await swap();
                }
              } 

              resolve("Switch Strike Done")
          })
      })
    }
}

module.exports = batting;