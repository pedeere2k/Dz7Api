const axios=require('axios');
exports.tt=async(req,res)=>{try{const url=req.query.url;if(!url)return res.json({error:'url requerido'});
const r=await axios.get(`https://api.tiklydown.me/api/download?url=${encodeURIComponent(url)}`);
res.json({no_watermark:r.data.video.noWaterMark});}catch(e){res.json({error:e.message});}};