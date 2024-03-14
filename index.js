require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true,
  useUnifiedTopology: true});
const dns = require('node:dns');
// Basic Configuration
const port = process.env.PORT || 3000;
console.log(process.env.PORT);
app.use(cors());
const URLSchema = new mongoose.Schema({
  original_url :{type:String, required:true,unique:true},
  short_url:{type:String, required:true,unique:true}
})
const URLModel = mongoose.model("url",URLSchema);

app.use('/',bodyParser.urlencoded({extended:false}));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
 
  let url = req.body.url;
  try{
    urlObj = new URL(url);
    dns.lookup(urlObj.hostname,(err,address,family)=>{
      if(!address){
        res.json({ error: 'invalid url' });
      }else{
        let original_url = urlObj.href;
        let short_url =1;
        URLModel.find({}).sort({short_url:"desc"}).limit(1).then((latestUrl)=>{
          if(latestUrl.length>0){
            short_url = Number(latestUrl[0].short_url)+1;
          }
          resObj ={
            original_url : original_url,
            short_url:short_url
          }
          let newUrl = new URLModel(resObj);
          newUrl.save();
          res.json(resObj);
        })
      }
    })

  }catch(e){
    res.json({ error: 'invalid url' });
  }
});
app.get('/api/shorturl/:short_url',function(req,res){
  let short_url = req.params.short_url;
  URLModel.findOne({short_url:short_url}).then((foundUrl)=>{
    if(foundUrl){
      let original_url = foundUrl.original_url;
       res.redirect(original_url);
    }
    
  })
})
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
