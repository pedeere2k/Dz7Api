const fs=require('fs'); const path=require('path');
const db=path.join(__dirname,'../database/keys.json');
module.exports=(req,res,next)=>{const key=req.headers['api-key']; if(!key)return res.status(401).json({error:'API Key necessária'});
const data=JSON.parse(fs.readFileSync(db)); if(!data.keys.includes(key))return res.status(403).json({error:'Key inválida'}); next();};
