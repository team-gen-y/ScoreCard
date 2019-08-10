const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const batting = require('./node-scripts/batting');
const bowling = require('./node-scripts/bowling');
const variables = require('./node-scripts/variables');

var app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use((req,res,next)=>{
  console.log(`${req.url} is requested`);
  next();
})



// /** Delete Batting Record */
// const MongoClient = require('mongodb').MongoClient;
// const url = process.env.conn_string;
// MongoClient.connect(url, (err,db)=>{
//   for(let i=1; i<=11; i++){
//       let query = {num: i};
//       let newValue = {$set:{
//         name: '',
//         howOut: '',
//         runs: 0
//       }}
//       db.db("MatchDB").collection('Batting').updateOne(query, newValue, (error,result)=>{
//         if(error) throw error;
//         console.log(result);
//       })
//   }
// })


// //const MongoClient = require('mongodb').MongoClient;
// //const url = process.env.conn_string;
// MongoClient.connect(url, (err,db)=>{
//   for(let i=1; i<=11; i++){
//       let query = {num: i};
//       let newValue = {$set:{
//         name: '',
//         overs: '0.0',
//         runs: 0,
//         economy: '',
//         balls: 0
//       }}
//       db.db("MatchDB").collection('Bowling').updateOne(query, newValue, (error,result)=>{
//         if(error) throw error;
//         console.log(result);
//       })
//   }
// })


router.get('/', async(req,res)=>{
  let batData = batting.formatBatData(await batting.getBatData());
  let bowlData = bowling.formatBowlData(await bowling.getBowlData());
  let varData = await variables.getVarData();
  let currBatsmen = [varData[0]['striker'] , varData[0]['nonStriker']];
  let currBowler = varData[1]['currBowler'];
  let playersCount = [varData[2]['batsmenPlayed'], varData[2]['bowlersPlayed']];
  let extras = [ varData[3]['wides'], varData[3]['noBalls'], varData[3]['byes'], varData[3]['legByes'] ];
  let totScore = varData[4]['score'];
  
  console.log(`${req.url} is served`);
  console.log(currBatsmen);
  res.render('index', {
    batting: batData,
    bowling: bowlData,
    currBatsmen: currBatsmen,
    currBowler: currBowler,
    playersCount: playersCount,
    extras: extras,
    totScore: totScore
  });
})

router.post('/', async (req, res) => {

  let varData = await variables.getVarData();
  let playersCount = [varData[2]['batsmenPlayed'], varData[2]['bowlersPlayed']];
  let currBatsmen = [varData[0]['striker'] , varData[0]['nonStriker']];
  let currBowler = varData[1]['currBowler'];
  let totScore = varData[4]['score'];

  const keyArr = Object.keys(req.body);
  let whatSubmit = keyArr[keyArr.length-1];


  if(whatSubmit == 'batSubmit'){
    console.log(req.body);
    const batName = req.body.batName;
    await batting.addNewBat(batName);
    await variables.updateCount("bat", playersCount[0]);
    if(Object.keys(req.body)[1] == 'isOnStrike')
      console.log("bring on strike later");
  } 
  
  else if(whatSubmit == 'bowlSubmit'){
    const bowlName = req.body.bowlName;
    await bowling.addNewBowl(bowlName);
    await variables.updateCount("bowl",playersCount[1]);
  }

  else if(whatSubmit == 'runSubmit'){
      const run = parseInt(req.body.runs);
      const extra = req.body['extras'];
      console.log(extra)
      
      if(extra == 'none'){
        await batting.updateBatsmanData(run);
        await bowling.updateBowlerData(run,extra);
        await batting.switchStrike(run, currBatsmen);
      }
      else if(extra == 'wide' || extra == 'no'){
        await bowling.updateBowlerData(run,extra);
        await variables.updateExtras(run, extra, varData[3]);
      }
      else{
        await bowling.updateBowlerData(0,extra);
        await variables.updateExtras(run, extra, varData[3]);
      }

      await variables.updateScore();
  }


  else if(whatSubmit == 'selectBowlerSubmit'){
    let newBowler = req.body.selectBowler;
    await bowling.changeBowler(newBowler);
  }

  else if(whatSubmit == 'selectStrikerSubmit'){
   console.log(req.body);
   await batting.changeStriker(req.body.selectStriker,currBatsmen[0]);
  }

  else if(whatSubmit == 'outSubmit'){
     console.log(req.body);
     const run = parseInt(req.body.runs);
      
     if(req.body.howOut != 'runOut')
      await bowling.updateWicket(req.body.howOut);

      if(req.body['extras'] == 'none'){
        await batting.updateBatsmanData(run);
        await bowling.updateBowlerData(run);
        await batting.switchStrike(run, currBatsmen);
      }
      else{
        await variables.updateExtras(run, req.body['extras'], varData[3]);
      }

      await variables.updateScore();
      await batting.updateOutData(req.body.howOutBat,currBowler,req.body.howOut, req.body.fielder);
  }

  res.redirect('/');
});

app.use(router);
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>{
    console.log(`Server Running on ${PORT}`);
})
