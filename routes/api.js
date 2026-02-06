const r=require('express').Router(); const a=require('../middlewares/auth');
const s=require('../controllers/searchController');
const d=require('../controllers/downloadController');
const t=require('../controllers/tiktokController');
r.get('/search',a,s.yt); r.get('/download/mp3',a,d.mp3); r.get('/download/mp4',a,d.mp4); r.get('/tiktok',a,t.tt); module.exports=r;