const axios = require("axios");

async function Mollygram(username) {
  try {
    const url = `https://media.mollygram.com/?url=${encodeURIComponent(username)}`;

    const headers = {
      "accept": "*/*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "origin": "https://mollygram.com",
      "referer": "https://mollygram.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    };

    const { data } = await axios.get(url, { headers });
    if (data.status !== "ok") throw new Error("Falha ao obter dados");

    const html = data.html;

    const getMatch = (regex) => {
      const match = html.match(regex);
      return match ? match[1].trim() : null;
    };

    const profilePic =
      getMatch(/<img[^>]*class="[^"]*rounded-circle[^"]*"[^>]*src="([^"]+)"/i) ||
      getMatch(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*rounded-circle[^"]*"/i);

    const usernameFound = getMatch(/<h4 class="mb-0">([^<]+)<\/h4>/);
    const fullname = getMatch(/<p class="text-muted">([^<]+)<\/p>/);
    const bio = getMatch(/<p class="text-dark"[^>]*>([^<]+)<\/p>/);
    const posts = getMatch(
      /<div[^>]*>\s*<span class="d-block h5 mb-0">([^<]+)<\/span>\s*<div[^>]*>posts<\/div>/i
    );
    const followers = getMatch(
      /<div[^>]*>\s*<span class="d-block h5 mb-0">([^<]+)<\/span>\s*<div[^>]*>followers<\/div>/i
    );
    const following = getMatch(
      /<div[^>]*>\s*<span class="d-block h5 mb-0">([^<]+)<\/span>\s*<div[^>]*>following<\/div>/i
    );

    return {
      username: usernameFound,
      fullname,
      bio,
      profilePic,
      posts,
      followers,
      following,
    };
  } catch (error) {
    console.error("Erro:", error.message);
    return { error: "Não foi possível coletar os dados." };
  }
}

module.exports = { Mollygram };