const fs = require('fs')
const path = require('path')

const express = require('express')

require('dotenv').config()

const Jimp = require('jimp');

const ytdl = require('@distube/ytdl-core')

const yts = require('yt-search')

const axios = require('axios')

const scdl = require('soundcloud-downloader')

const { downloadVideo } = require("hybrid-ytdl");

const { exec } = require("child_process")

const cheerio = require('cheerio')

const TOKEN = "196201095mtbypkraRi354235128";

const USERS = ["pdr2k", "Zypher2k"]; 

const { Mollygram } = require("./modulos-api/instastalk");

const MASTER_KEY = "pdr2k";

const DEEPSEEK_KEY = "sk-fd70994932d549c0a9509d665c604446";

const RAPIDAPI_KEY = '58f825cfccmsh30343623109db27p1f50a6jsn4f961f823cd4'

const RAPIDAPI_HOST = 'tiktok-scraper7.p.rapidapi.com'

const VERIPHONE_KEY = "8B1755C4D1CC40859C91E01ECD9785CE";

const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImUyNGUxN2ZkLTljMTgtNDhkOS05ZTY3LWM5MzM1NjVhYzhjZCIsImlhdCI6MTc2ODcwNTI3MSwic3ViIjoiZGV2ZWxvcGVyLzc0OTQ4Yjc1LTY5MmEtMzk5Ni0wZjBhLWJmNGVlNjdhZTFkOCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODYuMjE5LjEzOS4xNSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.U20NwcTaXK8_ddkydOB3cVp_QP-0H58FqxfXbw_dI1YZNci97kGTyoYLzkpjAkAjhRbXLougoHNon1sf1XzyZg";

const api = axios.create({
  baseURL: "https://api.clashroyale.com/v1",
  headers: {
    Authorization: `Bearer ${API_KEY}`
  }
});

// FUNCTION ABAIXO
async function pinterestImage(query) {
  const searchUrl =
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:pinterest.com')}`

  const { data } = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  })

  const $ = cheerio.load(data)
  let pinUrl = null

  $('a.result__a').each((_, el) => {
    const href = $(el).attr('href')

    if (href && href.includes('/l/?uddg=')) {
      const match = href.match(/uddg=([^&]+)/)
      if (match) {
        pinUrl = decodeURIComponent(match[1])
        return false
      }
    }
  })

  if (!pinUrl) return null

  const pinPage = await axios.get(pinUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })

  const $$ = cheerio.load(pinPage.data)

  const img =
    $$('meta[property="og:image"]').attr('content') ||
    $$('img[src*="pinimg.com"]').attr('src')

  return img || null
}

const app = express()
const PORT = 3000

const statsPath = path.join(__dirname, 'stats', 'visitas.json')
function initStats() {
  if (!fs.existsSync(statsPath)) {
    fs.mkdirSync(path.dirname(statsPath), { recursive: true })
    fs.writeFileSync(
      statsPath,
      JSON.stringify({ total: 0, ips: [] }, null, 2)
    )
  }
}
initStats()

const apiKeys = {
  "pdr2k": {
    owner: "pdr",
    requests: 1000
  },
  "Zypher": {
    owner: "Zypher",
    requests: 1000
  }
};

app.use('/api', (req, res, next) => {
  const key = req.query.apikey || req.headers['x-api-key']

  if (!key) {
    return res.status(401).json({
      status: false,
      error: 'apikey não fornecida'
    })
  }

  const data = apiKeys[key]

  if (!data) {
    return res.status(403).json({
      status: false,
      error: 'apikey inválida'
    })
  }

  if (data.requests <= 0) {
    return res.status(403).json({
      status: false,
      error: 'apikey sem créditos'
    })
  }

  data.requests--
  req.apiKey = key
  req.apiData = data
  next()
})

app.get('/', (req, res) => {
  res.json({
    status: true,
    api: 'Dz7api',
    message: 'API online'
  })
})


app.get('/api/key/info', (req, res) => {
  res.json({
    status: true,
    owner: req.apiData.owner,
    remaining_requests: req.apiData.requests
  })
})


app.get('/api/search/youtube', async (req, res) => {
  try {
    const q = req.query.q
    if (!q) {
      return res.status(400).json({ status: false, error: 'query q obrigatória' })
    }

    const r = await yts(q)
    const videos = r.videos.slice(0, 10).map(v => ({
      title: v.title,
      url: v.url,
      duration: v.timestamp,
      thumbnail: v.thumbnail,
      views: v.views,
      author: v.author.name
    }))

    res.json({
      status: true,
      creator: 'pdr2k',
      results: videos
    })
  } catch {
    res.status(500).json({ status: false, error: 'erro na busca' })
  }
})


app.get('/api/download/youtube/mp3', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({
        status: false,
        error: 'URL obrigatória'
      });
    }

    const file = `ytmp3_${Date.now()}.mp3`;

    exec(
      `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${file}" "${url}"`,
      { timeout: 120000 },
      err => {
        if (err) {
          return res.status(500).json({
            status: false,
            error: 'erro ao converter para mp3'
          });
        }

        res.setHeader(
          'Content-Disposition',
          'attachment; filename="audio.mp3"'
        );

        res.download(file, () => {
          fs.unlink(file, () => {});
        });
      }
    );

  } catch {
    res.status(500).json({
      status: false,
      error: 'erro interno mp3'
    });
  }
});


app.get('/api/download/youtube/mp4', async (req, res) => {
  const url = req.query.url
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ status: false, error: 'URL inválida' })
  }

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="video.mp4"'
  )

  ytdl(url, {
    filter: format =>
      format.container === 'mp4' &&
      format.hasVideo &&
      format.hasAudio &&
      !format.isHLS &&
      !format.isDashMPD,
    quality: 'highestvideo',
    highWaterMark: 1 << 25
  }).pipe(res)
})


app.get('/api/download/tiktok', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({ status: false, error: 'URL obrigatória' })
    }

    const api = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    const { data } = await axios.get(api)

    res.json({
      status: true,
      criador: 'pdr2k',
      author: data.data.author.nickname,
      desc: data.data.title,
      video: data.data.play,
      music: data.data.music,
      thumbnail: data.data.cover
    })
  } catch {
    res.status(500).json({ status: false, error: 'erro tiktok' })
  }
})


app.get('/api/search/tiktok', async (req, res) => {
  try {
    const q = req.query.q
    if (!q) return res.status(400).json({ status: false, error: 'query q obrigatória' })

    const api = `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=10`
    const { data } = await axios.get(api)

    const results = data.data.videos.map(v => ({
      id: v.video_id,
      author: v.author.nickname,
      username: v.author.unique_id,
      desc: v.title,
      thumbnail: v.cover,
      video: v.play,
      views: v.play_count
    }))

    res.json({ status: true, criador: 'pdr2k', results })
  } catch {
    res.status(500).json({ status: false, error: 'erro tiktok search' })
  }
})


app.get('/api/tiktok/user', async (req, res) => {
  try {
    const user = req.query.user
    if (!user) return res.status(400).json({ status: false, error: 'user obrigatório' })

    const api = `https://tikwm.com/api/user/posts?unique_id=${encodeURIComponent(user)}&count=10`
    const { data } = await axios.get(api)

    const videos = data.data.videos.map(v => ({
      desc: v.title,
      video: v.play,
      likes: v.digg_count,
      views: v.play_count
    }))

    res.json({ status: true, creator: 'pdr2k', user, results: videos })
  } catch {
    res.status(500).json({ status: false, error: 'erro user tiktok' })
  }
})

app.get('/api/search/pinterest', async (req, res) => {
  try {
    const q = req.query.q
    if (!q) {
      return res.json({
        status: false,
        error: 'query obrigatória'
      })
    }

    const imgUrl = await pinterestImage(q)
    if (!imgUrl) {
      return res.json({
        status: false,
        error: 'nenhuma imagem encontrada'
      })
    }

    const img = await axios.get(imgUrl, {
      responseType: 'stream'
    })

    res.setHeader(
      'Content-Type',
      img.headers['content-type'] || 'image/jpeg'
    )

    img.data.pipe(res)

  } catch (e) {
    console.error(e)
    res.json({
      status: false,
      error: 'erro ao buscar imagem pinterest'
    })
  }
})


app.get('/api/search/youtube/playlist', async (req, res) => {
  try {
    const q = req.query.q
    if (!q) {
      return res.status(400).json({
        status: false,
        error: 'query q obrigatória'
      })
    }

    const r = await yts(q)
    if (!r.playlists || !r.playlists.length) {
      return res.status(404).json({
        status: false,
        error: 'nenhuma playlist encontrada'
      })
    }

    const playlists = r.playlists.slice(0, 10).map(p => ({
      title: p.title,
      url: p.url,
      thumbnail: p.thumbnail,
      video_count: p.videoCount,
      views: p.views,
      author: p.author?.name
    }))

    res.json({
      status: true,
      creator: 'pdr2k',
      query: q,
      results: playlists
    })
  } catch (e) {
    res.status(500).json({
      status: false,
      error: 'erro na busca de playlists'
    })
  }
})

app.get('/api/download/soundcloud', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) return res.status(400).json({ error: 'URL obrigatória' })

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="soundcloud.mp3"'
    )

    const stream = await scdl.download(url)
    stream.pipe(res)
  } catch (e) {
    res.status(500).json({ error: 'erro soundcloud download' })
  }
})

app.get('/api/search/soundcloud', async (req, res) => {
  try {
    const q = req.query.q
    if (!q) return res.status(400).json({ error: 'query q obrigatória' })

    const results = await scdl.search({
      query: q,
      limit: 10,
      resourceType: 'tracks'
    })

    const tracks = results.collection.map(t => ({
      title: t.title,
      author: t.user.username,
      duration: Math.floor(t.duration / 1000),
      url: t.permalink_url,
      thumbnail: t.artwork_url
    }))

    res.json(tracks)
  } catch (e) {
    res.status(500).json({ error: 'erro soundcloud search' })
  }
})

app.get('/api/download/instagram', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({
        status: false,
        error: 'URL obrigatória'
      })
    }

    const file = `ig_${Date.now()}.mp4`

    exec(`yt-dlp -f mp4 -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar vídeo do instagram'
        })
      }

      res.download(file, () => {
        fs.unlinkSync(file)
      })
    })

  } catch {
    res.status(500).json({
      status: false,
      error: 'erro interno instagram'
    })
  }
})


app.get('/api/download/facebook', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({
        status: false,
        error: 'URL obrigatória'
      })
    }

    const file = `fb_${Date.now()}.mp4`

    exec(`yt-dlp -f mp4 -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar vídeo do facebook'
        })
      }

      res.download(file, () => {
        fs.unlinkSync(file)
      })
    })

  } catch {
    res.status(500).json({
      status: false,
      error: 'erro aqui'
    })
  }
})

app.get('/api/download/twitter', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({
        status: false,
        error: 'URL obrigatória'
      })
    }

    const file = `tw_${Date.now()}.mp4`

    exec(`yt-dlp -f mp4 -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar vídeo do twitter'
        })
      }

      res.download(file, () => {
        fs.unlinkSync(file)
      })
    })

  } catch {
    res.status(500).json({
      status: false,
      error: 'erro interno twitter'
    })
  }
})

app.get('/api/download/kwai', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({
        status: false,
        error: 'URL obrigatória'
      })
    }

    const file = `kwai_${Date.now()}.mp4`

    exec(`yt-dlp -f mp4 -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar vídeo do kwai'
        })
      }

      res.download(file, () => {
        fs.unlinkSync(file)
      })
    })

  } catch {
    res.status(500).json({
      status: false,
      error: 'erro interno kwai'
    })
  }
})

app.get('/api/download/pinterest/video', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({ status: false, error: 'URL obrigatória' })
    }

    const file = `pin_${Date.now()}.mp4`

    exec(`yt-dlp -f "bv*+ba/b" -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar vídeo do pinterest'
        })
      }

      res.download(file, () => fs.unlinkSync(file))
    })
  } catch {
    res.status(500).json({ status: false, error: 'erro interno pinterest' })
  }
})

app.get('/api/download/threads', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({ status: false, error: 'URL obrigatória' })
    }

    const file = `threads_${Date.now()}.mp4`

    exec(`yt-dlp -f "bv*+ba/b" -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar vídeo do threads'
        })
      }

      res.download(file, () => fs.unlinkSync(file))
    })
  } catch {
    res.status(500).json({ status: false, error: 'erro interno threads' })
  }
})

app.get('/api/download/twitch/clip', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({ status: false, error: 'URL obrigatória' })
    }

    const file = `twitch_${Date.now()}.mp4`

    exec(`yt-dlp -f "bv*+ba/b" -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar clip da twitch'
        })
      }

      res.download(file, () => fs.unlinkSync(file))
    })
  } catch {
    res.status(500).json({ status: false, error: 'erro interno twitch' })
  }
})

app.get('/api/download/reddit', async (req, res) => {
  try {
    const url = req.query.url
    if (!url) {
      return res.status(400).json({ status: false, error: 'URL obrigatória' })
    }

    const file = `reddit_${Date.now()}.mp4`

    exec(`yt-dlp -f "bv*+ba/b" -o "${file}" "${url}"`, err => {
      if (err) {
        return res.status(500).json({
          status: false,
          error: 'erro ao baixar vídeo do reddit'
        })
      }

      res.download(file, () => fs.unlinkSync(file))
    })
  } catch {
    res.status(500).json({ status: false, error: 'erro interno reddit' })
  }
})

app.get('/api/tools/ipinfo', async (req, res) => {
  try {
    const { ip } = req.query
    if (!ip) return res.json({ status: false, error: 'IP não informado' })

    const { data } = await axios.get(`https://ipapi.co/${ip}/json/`)

    return res.json({
      status: true,
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      isp: data.org,
      timezone: data.timezone
    })
  } catch (e) {
    return res.json({ status: false, error: 'erro ipinfo' })
  }
})

app.get('/api/tools/encurtar/url', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.json({ status: false, error: 'URL não informada' })

    const { data } = await axios.get(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    )

    return res.json({
      criador: 'Pdr2k',
      status: true,
      original: url,
      short: data
    })
  } catch (e) {
    return res.json({ status: false, error: 'erro encurtar url' })
  }
})

app.get('/api/flodngl', async (req, res) => {
    const { username, mensagem, quantidade } = req.query;

    if (!username || !mensagem) {
        return res.status(400).json({
            status: false,
            message: 'Envie username e mensagem'
        });
    }

    const vezes = Math.min(parseInt(quantidade) || 1, 300); 

    const gerarDeviceId = () =>
        [...Array(50)].map(() => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

    let sucessos = 0;
    let falhas = 0;

    const enviarNGL = async () => {
        try {
            await axios.post(
                'https://ngl.link/api/submit',
                new URLSearchParams({ username, question: mensagem, deviceId: gerarDeviceId() }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'NGL Android 4.0.3' } }
            );
            sucessos++;
        } catch (e) {
            falhas++;
        }
    };

    for (let i = 0; i < vezes; i++) {
        await new Promise(r => setTimeout(r, 500));
        await enviarNGL();
    }

    res.json({
        criador: 'Pdr2k',
        status: true,
        message: `Envio concluído para @${username}`,
        sucessos,
        falhas
    });
});

app.get("/api/search/aptoide", async (req, res) => {
    try {
        const { app: appName } = req.query;

        if (!appName) {
            return res.json({
                criador: "pdr2k",
                status: false,
                erro: "Você precisa enviar ?app=nome"
            });
        }

        const url = `https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(appName)}`;
        const resposta = await axios.get(url);

        const dados = resposta.data;

        if (!dados?.datalist?.list?.length) {
            return res.json({
                criador: "pdr2j",
                status: false,
                erro: "Nenhum resultado encontrado."
            });
        }

        const appInfo = dados.datalist.list[0];

        res.json({
            criador: "pdr2k",
            status: true,
            resultado: {
                nome: appInfo.name || "Desconhecido",
                tamanho: appInfo.size ? (appInfo.size / 1024 / 1024).toFixed(1) + " MB" : "Indefinido",
                desenvolvedor: appInfo.store_name || "Desconhecido",
                downloads: appInfo.stats?.downloads || 0,
                link: appInfo.file?.path || null
            }
        });

    } catch (e) {
        res.json({
            criador: "pdr2k",
            status: false,
            erro: "Falha ao consultar o Aptoide",
            detalhe: e.message
        });
    }
});


app.get('/api/search/wikipedia', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(400).json({ error: 'Parâmetro q é obrigatório' })
    }

    const search = await axios.get(
      'https://pt.wikipedia.org/w/api.php',
      {
        params: {
          action: 'query',
          list: 'search',
          srsearch: q,
          format: 'json',
          origin: '*'
        },
        headers: {
          'User-Agent': 'MinhaAPI/1.0 (contato@exemplo.com)'
        }
      }
    )

    const result = search.data.query.search[0]
    if (!result) {
      return res.status(404).json({ error: 'Nada encontrado' })
    }

    const summary = await axios.get(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`,
      {
        headers: {
          'User-Agent': 'MinhaAPI/1.0 (contato@exemplo.com)'
        }
      }
    )

    res.json({
      criador: 'pdr2k',
      title: summary.data.title,
      description: summary.data.extract,
      page: summary.data.content_urls.desktop.page,
      thumbnail: summary.data.thumbnail?.source || null
    })

  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: 'Erro ao buscar na Wikipedia' })
  }
})

app.get('/api/download/mediafire', async (req, res) => {
  try {
    const { url } = req.query
    if (!url || !url.includes('mediafire.com')) {
      return res.status(400).json({ error: 'Link MediaFire inválido' })
    }

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    const $ = cheerio.load(data)

    const download = $('#downloadButton').attr('href')
    const title = $('.filename').text().trim()
    const size = $('.details li').first().text().trim()

    if (!download) {
      return res.status(404).json({ error: 'Link de download não encontrado' })
    }

    res.json({
      criador: 'pdr2k',
      title,
      size,
      direct_download: download
    })

  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: 'Erro ao processar MediaFire' })
  }
})

app.get('/api/search/npm', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json({ error: 'Parâmetro q é obrigatório' })

    const { data } = await axios.get(
      `https://registry.npmjs.org/${q}`
    )

    res.json({
      criador: 'pdr2k',
      name: data.name,
      latest: data['dist-tags'].latest,
      description: data.description,
      homepage: data.homepage || null,
      repository: data.repository?.url || null,
      author: data.author || null
    })
  } catch {
    res.status(404).json({ error: 'Pacote não encontrado' })
  }
})
// AQUI EM BAIXO SAO AS ROTAS DE FERRAMENTAS

app.get('/api/ferramentas/stalktiktok', async (req, res) => {
  const { user } = req.query

  if (!user) {
    return res.json({
      status: false,
      msg: 'Informe o usuário do TikTok'
    })
  }

  try {
    const response = await axios.get(
      'https://tiktok-scraper7.p.rapidapi.com/user/info',
      {
        params: { unique_id: user },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      }
    )

    const u = response.data.data.user
    const s = response.data.data.stats

    return res.json({
      status: true,
      criador: 'pdr2k',
      plataforma: 'TikTok',
      usuario: u.uniqueId,
      nome: u.nickname,
      bio: u.signature,
      seguidores: s.followerCount,
      seguindo: s.followingCount,
      curtidas: s.heartCount,
      videos: s.videoCount,
      foto: u.avatarLarger
    })

  } catch (err) {
    return res.json({
      status: false,
      msg: 'Usuário não encontrado ou limite da API atingido'
    })
  }
})

app.get('/api/ferramentas/stalkff', async (req, res) => {
  const { id } = req.query
  if (!id) return res.json({ status: false, msg: 'Informe o ID do Free Fire' })

  try {
    const url = `https://freefirejornal.com/perfil-jogador-freefire/${id}`
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const $ = cheerio.load(html)
    const bodyText = $('body').text().replace(/\s+/g, ' ')

    let nome = $('h1').first().text().trim()
    nome = nome.split('ID')[0].replace('Free Fire: Confira o Perfil do Jogador', '').trim()

    const levelMatch = bodyText.match(/Level:\s*([\d]+)/i)
    const xpMatch = bodyText.match(/Experience:\s*([\d]+)/i)
    const regionMatch = bodyText.match(/Region:\s*([A-Z]+)/i)
    const rankedPointsMatch = bodyText.match(/Ranked Points:\s*([\d]+)/i)
    const likesMatch = bodyText.match(/👍\s*:\s*([\d]+)/)
    const bioMatch = bodyText.match(/Assinatura\s*\/\s*Bio:\s*(.*?)Atualizado/i)
    const lastLoginMatch = bodyText.match(/Último Login:\s*([\d\/\-\:]+)/i)
    const createdMatch = bodyText.match(/Conta criada:\s*([\d\/\-\:]+)/i)

    const profile = {
      nome: nome || 'Desconhecido',
      id,
      level: levelMatch ? Number(levelMatch[1]) : null,
      xp: xpMatch ? Number(xpMatch[1]) : null,
      region: regionMatch ? regionMatch[1] : null,
      rankedPoints: rankedPointsMatch ? Number(rankedPointsMatch[1]) : null,
      likes: likesMatch ? Number(likesMatch[1]) : 0,
      bio: bioMatch ? bioMatch[1].trim() : null,
      last_login: lastLoginMatch ? lastLoginMatch[1] : null,
      created_at: createdMatch ? createdMatch[1] : null
    }

    const parseBlock = (label) => {
      const regex = new RegExp(`${label}: Solo:\\s*(\\d+)\\s*\\| Duo:\\s*(\\d+)\\s*\\| Squad:\\s*(\\d+)`, 'i')
      const match = bodyText.match(regex)
      return match
        ? { solo: Number(match[1]), duo: Number(match[2]), squad: Number(match[3]) }
        : { solo: 0, duo: 0, squad: 0 }
    }

    const parseTextBlock = (label) => {
      const regex = new RegExp(`${label}: Solo:\\s*([\\d’”\\:]+).*?Duo:\\s*([\\d’”\\:]+).*?Squad:\\s*([\\d’”\\:]+)`, 'i')
      const match = bodyText.match(regex)
      return match ? { solo: match[1].trim(), duo: match[2].trim(), squad: match[3].trim() } : { solo: '0', duo: '0', squad: '0' }
    }

    const stats = {
      solo: {},
      duo: {},
      squad: {}
    }

    const numericFields = ['Partidas', 'Vitórias', 'Abates', 'Top 10/5/3', 'Média de Dano', 'Máximo de Abates em Jogo', 'Abates com Veículo', 'Tiros na Cabeça']
    const textFields = ['Média de Sobrevivência', 'Taxa de Tiros na Cabeça', 'Taxa de Top 10/5/3']

    numericFields.forEach(f => {
      const parsed = parseBlock(f)
      stats.solo[f] = parsed.solo
      stats.duo[f] = parsed.duo
      stats.squad[f] = parsed.squad
    })

    textFields.forEach(f => {
      const parsed = parseTextBlock(f)
      stats.solo[f] = parsed.solo
      stats.duo[f] = parsed.duo
      stats.squad[f] = parsed.squad
    })

    res.json({
      status: true,
      criador: 'pdr2k',
      profile,
      stats
    })

  } catch (err) {
    console.log(err.message)
    res.json({ status: false, msg: 'Erro ao processar perfil' })
  }
})
app.get("/api/ferramentas/stalkinsta", async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({
      status: false,
      message: "Parâmetro 'username' é obrigatório. Exemplo: /api/stalkinsta?username=exemplo",
    });
  }

  const data = await Mollygram(username);
  if (data.error) {
    return res.status(500).json({ status: false, message: data.error });
  }

  res.json({
    status: true,
    criador: "pdr2k",
    resultado: data,
  });
});

app.get('/api/ferramentas/operadora', async (req, res) => {
  const { numero, apikey } = req.query;

  if (!numero || !apikey) {
    return res.status(400).json({ 
      erro: "Informe numero e apikey na URL: ?numero=...&apikey=..." 
    });
  }

  if (!USERS.includes(apikey)) {
    return res.status(403).json({ erro: "Chave de usuário inválida" });
  }

  try {
    const numLimpo = numero.replace(/\D/g, "");

    if (!numLimpo) {
      return res.status(400).json({ erro: "Número inválido" });
    }

    const url = `https://api.veriphone.io/v2/verify?phone=%2B55${numLimpo}&key=8B1755C4D1CC40859C91E01ECD9785CE`;

    const resposta = await axios.get(url);

    res.json(resposta.data);

  } catch (e) {
    res.status(500).json({
      erro: "Falha ao consultar a API externa",
      detalhe: e.message
    });
  }
});


// AQUI PRA BAIXO SAO AS ROTA DE CLASH ROYALE

app.get("/api/clash/perfil", async (req, res) => {
  const { tag } = req.query;
  if (!tag) return res.json({ error: "Tag não informada. troque # por %23" });

  try {
    const response = await api.get(`/players/${encodeURIComponent(tag)}`);
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

app.get("/api/clash/clan", async (req, res) => {
  const { tag } = req.query;
  if (!tag) return res.json({ error: "Tag do clã não informada. troque # por %23" });

  try {
    const response = await api.get(`/clans/${encodeURIComponent(tag)}`);
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

app.get("/api/clash/battlelog", async (req, res) => {
  const { tag } = req.query;
  if (!tag) return res.json({ error: "Tag não informada. troque # por %23" });

  try {
    const response = await api.get(
      `/players/${encodeURIComponent(tag)}/battlelog`
    );
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

app.get("/api/clash/top/global", async (req, res) => {
  try {
    const response = await api.get("/locations/global/rankings/players");
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

app.get("/api/clash/top/brasil", async (req, res) => {
  try {
    const response = await api.get("/locations/57000060/rankings/players"); 
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

app.get("/cards", async (req, res) => {
  try {
    const response = await api.get("/cards");
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

app.get("/api/clash/chests", async (req, res) => {
  const { tag } = req.query;
  if (!tag) return res.json({ error: "Se Você Usou # mude para %23" });

  try {
    const response = await api.get(
      `/players/${encodeURIComponent(tag)}/upcomingchests`
    );
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

// CONSULTAS


app.get('/api/consultas/cep', async (req, res) => {
  const { cep, apikey } = req.query;

  if (!cep || !apikey) {
    return res.status(400).json({
      erro: "Informe cep e apikey na URL: ?cep=...&apikey=..."
    });
  }

  if (!USERS.includes(apikey)) {
    return res.status(403).json({ erro: "Chave de usuário inválida" });
  }

  try {
    const cepLimpo = cep.replace(/\D/g, '');

    if (!cepLimpo) {
      return res.status(400).json({ erro: "CEP inválido" });
    }

    const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
    const resposta = await axios.get(url);

    res.json(resposta.data);

  } catch (e) {
    res.status(500).json({
      erro: "Falha ao consultar ViaCEP",
      detalhe: e.message
    });
  }
});


app.get('/api/consultas/cep2', async (req, res) => {
  const { cep, apikey } = req.query;

  if (!cep || !apikey) {
    return res.status(400).json({
      erro: "Informe cep e apikey na URL: ?cep=...&apikey=..."
    });
  }

  if (!USERS.includes(apikey)) {
    return res.status(403).json({ erro: "Chave de usuário inválida" });
  }

  try {
    const cepLimpo = cep.replace(/\D/g, '');

    if (!cepLimpo) {
      return res.status(400).json({ erro: "CEP inválido" });
    }

    const url = `https://brasilapi.com.br/api/cep/v2/${cepLimpo}`;
    const resposta = await axios.get(url);

    res.json(resposta.data);

  } catch (e) {
    res.status(500).json({
      erro: "Falha ao consultar BrasilAPI",
      detalhe: e.message
    });
  }
});

// ROTAS ANIMES ABAIXO

app.get('/api/anime/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ error: 'q é obrigatório' })

    const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}`)

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar anime' })
  }
})


app.get('/api/anime/images', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).send('Parâmetro q é obrigatório')

    const response = await axios.get(
      'https://animepixels-api.vercel.app/api/media/search/image',
      {
        params: { q, limit: 50 }
      }
    )

    const images = response.data.results

    if (!images || images.length === 0) {
      return res.status(404).send('Nenhuma imagem encontrada')
    }

    const random = images[Math.floor(Math.random() * images.length)]

    const imageUrl = random.url

    if (!imageUrl) {
      return res.status(404).send('Imagem inválida')
    }

    res.redirect(imageUrl)

  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro ao buscar imagem de anime')
  }
})

app.get('/api/anime/gifs', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).send('Parâmetro q é obrigatório')

    const response = await axios.get(
      'https://animepixels-api.vercel.app/api/media/search',
      {
        params: {
          q,
          media_type: 'gif',
          limit: 50
        }
      }
    )

    const gifs = response.data.results

    if (!gifs || gifs.length === 0) {
      return res.status(404).send('Nenhum GIF encontrado')
    }

    const random = gifs[Math.floor(Math.random() * gifs.length)]

    if (!random.url) {
      return res.status(404).send('GIF inválido')
    }

    res.redirect(random.url)

  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro ao buscar GIF de anime')
  }
})

app.get('/api/anime/character', async (req, res) => {
  try {
    const r = await axios.get('https://api.jikan.moe/v4/random/characters')
    const c = r.data.data

    const imageUrl = c.images?.jpg?.image_url

    if (!imageUrl) {
      return res.status(404).send('Imagem não encontrada')
    }

    res.redirect(imageUrl)

  } catch (e) {
    console.error(e.message)
    res.status(500).send('Erro ao buscar personagem')
  }
})

app.get('/api/anime/waifu', async (req, res) => {
  try {
    const r = await axios.get('https://api.waifu.im/search', {
      params: { is_nsfw: false }
    })

    const w = r.data?.images?.[0]
    const imageUrl = w?.url

    if (!imageUrl) {
      return res.status(404).send('Imagem não encontrada')
    }

    res.redirect(imageUrl)

  } catch (e) {
    console.error(e.message)
    res.status(500).send('Erro ao buscar waifu')
  }
})

app.get('/api/anime/manga', async (req, res) => {
  try {
    const r = await axios.get('https://api.jikan.moe/v4/random/manga')
    const m = r.data.data

    const imageUrl = m.images?.jpg?.image_url
    if (!imageUrl) {
      return res.status(404).send('Imagem não encontrada')
    }

    res.redirect(imageUrl)

  } catch (e) {
    console.error(e.message)
    res.status(500).send('Erro ao buscar mangá')
  }
})


app.get('/api/anime/fact', async (req, res) => {
  try {
    const list = await axios.get('https://anime-facts-rest-api.herokuapp.com/api/v1')
    const animes = list.data.data

    if (!animes || animes.length === 0) {
      return res.status(404).json({ error: 'Nenhum anime encontrado' })
    }

    const randomAnime = animes[Math.floor(Math.random() * animes.length)].anime_name

    const factsRes = await axios.get(
      `https://anime-facts-rest-api.herokuapp.com/api/v1/${randomAnime}`
    )

    const facts = factsRes.data.data
    const randomFact = facts[Math.floor(Math.random() * facts.length)]

    res.json({
      anime: randomAnime,
      fact: randomFact.fact
    })

  } catch (e) {
    console.error(e.message)
    res.status(500).json({ error: 'Erro ao buscar fact de anime' })
  }
})

app.get('/api/anime/opening', async (req, res) => {
  try {
    const { anime } = req.query
    if (!anime) {
      return res.status(400).json({ error: 'Parâmetro anime é obrigatório' })
    }

    const search = await axios.get('https://api.jikan.moe/v4/anime', {
      params: { q: anime, limit: 1 }
    })

    const a = search.data?.data?.[0]
    if (!a) {
      return res.status(404).json({ error: 'Anime não encontrado' })
    }

    const openings = a.theme?.openings
    if (!openings || openings.length === 0) {
      return res.status(404).json({ error: 'Opening não encontrada' })
    }

    res.json({
      anime: a.title,
      openings
    })

  } catch (e) {
    console.error(e.message)
    res.status(500).json({ error: 'Erro ao buscar opening' })
  }
})

app.get('/stats/visitantes', (req, res) => {
  try {
    const raw = fs.readFileSync(statsPath)
    const data = JSON.parse(raw)

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress

    if (!data.ips.includes(ip)) {
      data.ips.push(ip)
      data.total++
      fs.writeFileSync(statsPath, JSON.stringify(data, null, 2))
    }

    res.json({ total: data.total })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao contar visitas' })
  }
})

app.get('/status', (req, res) => {
  res.json({
    status: true,
    uptime: process.uptime()
  })
})

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs.html'))
})

app.get('/painel', (req, res) => {
  res.sendFile(path.join(__dirname, 'painel.html'))
})



app.listen(PORT, '0.0.0.0', () => {
  console.log('Dz7 Api Rodando, Port:', PORT)
})