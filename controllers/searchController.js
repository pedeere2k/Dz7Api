const yts=require('yt-search'); exports.yt=async(req,res)=>{const q=req.query.q;if(!q)return res.json({error:'q requerido'});
const r=await yts(q);res.json(r.videos.slice(0,15));};