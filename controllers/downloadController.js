const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg'); 


exports.mp3 = async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.json({ error: 'url requerido' });

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        ffmpeg(ytdl(url, { filter: 'audioonly' }))
            .audioBitrate(128)
            .format('mp3')
            .on('error', err => res.json({ error: err.message }))
            .pipe(res);

    } catch (e) {
        res.json({ error: e.message });
    }
};


exports.mp4 = async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.json({ error: 'url requerido' });

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        ytdl(url, { quality: 'highestvideo' })
            .on('error', err => res.json({ error: err.message }))
            .pipe(res);

    } catch (e) {
        res.json({ error: e.message });
    }
};