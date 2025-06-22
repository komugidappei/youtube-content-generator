const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

app.use(cors());
app.use(express.json());

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  const videoId = match ? match[1] : null;
  console.log('URL解析:', url, '-> Video ID:', videoId);
  return videoId;
}

async function getVideoMetadataByAPI(videoId) {
  console.log('YouTube Data API で取得試行中...');
  
  const response = await youtube.videos.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    id: [videoId],
  });

  if (!response.data.items || response.data.items.length === 0) {
    throw new Error('動画が見つかりません');
  }

  const video = response.data.items[0];
  const snippet = video.snippet;
  const statistics = video.statistics;
  const contentDetails = video.contentDetails;

  console.log('API経由で取得成功 - タイトル:', snippet.title);

  return {
    title: snippet.title,
    description: snippet.description || '',
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    tags: snippet.tags || [],
    categoryId: snippet.categoryId,
    viewCount: statistics.viewCount,
    likeCount: statistics.likeCount,
    duration: contentDetails.duration,
    thumbnails: snippet.thumbnails
  };
}

async function getVideoMetadataByScraping(videoId) {
  console.log('ウェブスクレイピングで取得試行中...');
  
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // ページのscriptタグからJSON-LDデータを抽出
    let videoData = null;
    
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const jsonData = JSON.parse($(elem).html());
        if (jsonData['@type'] === 'VideoObject') {
          videoData = jsonData;
        }
      } catch (e) {
        // JSON解析エラーは無視
      }
    });

    // メタタグからも情報を取得
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="title"]').attr('content') || 
                  $('title').text() || '';
    
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content') || '';
    
    const channelName = $('link[itemprop="name"]').attr('content') || 
                       $('meta[name="author"]').attr('content') || '';

    // 初期データスクリプトから詳細情報を抽出
    let detailedInfo = {};
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('var ytInitialData')) {
        try {
          const match = scriptContent.match(/var ytInitialData = ({.+?});/);
          if (match) {
            const data = JSON.parse(match[1]);
            // 動画の詳細情報を抽出
            const videoDetails = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer;
            if (videoDetails) {
              detailedInfo.title = videoDetails.title?.runs?.[0]?.text || title;
              detailedInfo.viewCount = videoDetails.viewCount?.videoViewCountRenderer?.viewCount?.simpleText || '0';
            }
            
            const secondaryInfo = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer;
            if (secondaryInfo) {
              detailedInfo.channelTitle = secondaryInfo.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || channelName;
              detailedInfo.description = secondaryInfo.attributedDescription?.content || description;
            }
          }
        } catch (e) {
          // 解析エラーは無視
        }
      }
    });

    const finalVideoInfo = {
      title: detailedInfo.title || title.replace(' - YouTube', '') || 'YouTube動画',
      description: detailedInfo.description || description || '',
      channelTitle: detailedInfo.channelTitle || channelName || 'Unknown Channel',
      publishedAt: videoData?.uploadDate || new Date().toISOString(),
      tags: videoData?.keywords || [],
      categoryId: videoData?.genre || '1',
      viewCount: detailedInfo.viewCount || '0',
      likeCount: '0',
      duration: videoData?.duration || 'PT0M0S'
    };

    console.log('スクレイピング成功 - タイトル:', finalVideoInfo.title);
    console.log('チャンネル:', finalVideoInfo.channelTitle);
    console.log('説明文長:', finalVideoInfo.description.length);

    return finalVideoInfo;
  } catch (error) {
    console.error('スクレイピングエラー:', error.message);
    throw new Error('動画情報の取得に失敗しました');
  }
}

async function getVideoMetadata(videoId) {
  console.log('YouTube動画メタデータ取得開始 - Video ID:', videoId);
  
  // まずYouTube Data APIを試行
  if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== 'your_youtube_api_key_here') {
    try {
      return await getVideoMetadataByAPI(videoId);
    } catch (error) {
      console.error('YouTube API エラー:', error.message);
      console.log('ウェブスクレイピングにフォールバック...');
    }
  }
  
  // APIが利用できない場合はウェブスクレイピングを使用
  try {
    return await getVideoMetadataByScraping(videoId);
  } catch (error) {
    console.error('すべての取得方法が失敗:', error.message);
    
    // 最後の手段として基本情報を返す
    return {
      title: 'YouTube動画',
      description: 'YouTube動画のコンテンツ分析',
      channelTitle: 'Unknown Channel',
      publishedAt: new Date().toISOString(),
      tags: ['動画', 'YouTube'],
      categoryId: '1',
      viewCount: '0',
      likeCount: '0',
      duration: 'PT0M0S'
    };
  }
}

async function generateContent(videoInfo) {
  try {
    console.log('コンテンツ生成開始');
    console.log('タイトル:', videoInfo.title);
    console.log('説明文長:', videoInfo.description.length);
    
    // 動画情報を基にしたコンテンツテキストの作成
    const contentSource = `
動画タイトル: ${videoInfo.title}
チャンネル名: ${videoInfo.channelTitle}
公開日: ${videoInfo.publishedAt}
視聴回数: ${videoInfo.viewCount}
タグ: ${videoInfo.tags.join(', ')}

動画説明:
${videoInfo.description}
`;

    const articlePrompt = `
以下のYouTube動画の情報を基に、800〜1200文字の魅力的な記事を作成してください。

【動画情報】
${contentSource}

【重要な指示】
- 動画のタイトルと説明文から主要なテーマを抽出
- 視聴者にとって価値のある内容として構成
- SEOを考慮したキーワードを自然に含める
- 800〜1200文字程度で構成
- 読みやすい日本語で作成
- 動画の魅力や見どころを紹介
`;

    const twitterPrompt = `
以下のYouTube動画の情報を基に、Twitter/X用の魅力的な投稿文を作成してください。

【動画情報】
${contentSource}

【重要な指示】
- 動画の内容を簡潔に紹介
- 140〜280文字以内
- 関連するハッシュタグを3-5個含める
- 視聴を促すキャッチーな表現を使用
- 動画の見どころや価値を強調
`;

    const instagramPrompt = `
以下のYouTube動画の情報を基に、Instagram用の投稿文を作成してください。

【動画情報】
${contentSource}

【重要な指示】
- 動画の魅力を視覚的に表現
- 200〜300文字程度
- 関連するハッシュタグを5-10個含める
- 適度にエモジを使用
- エンゲージメントを促す文章構成
- ストーリー性のある内容
`;

    const titlePrompt = `
以下のYouTube動画の情報を基に、キャッチーなタイトル・キャッチコピーを5つ提案してください。

【動画情報】
${contentSource}

【重要な指示】
- 元のタイトルとは異なる表現で作成
- それぞれ異なるアプローチで作成
- 興味を引く表現を使用
- SEOも考慮する
- 1つのタイトルは30文字以内
- 動画の核心的な価値を表現
`;

    console.log('OpenAI API 呼び出し開始...');

    const [articleResponse, twitterResponse, instagramResponse, titleResponse] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: articlePrompt }],
        max_tokens: 1500,
        temperature: 0.7
      }),
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: twitterPrompt }],
        max_tokens: 500,
        temperature: 0.7
      }),
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: instagramPrompt }],
        max_tokens: 600,
        temperature: 0.7
      }),
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: titlePrompt }],
        max_tokens: 800,
        temperature: 0.8
      })
    ]);

    console.log('コンテンツ生成完了');

    return {
      article: articleResponse.choices[0].message.content,
      twitter: twitterResponse.choices[0].message.content,
      instagram: instagramResponse.choices[0].message.content,
      titles: titleResponse.choices[0].message.content,
      videoInfo: {
        title: videoInfo.title,
        channel: videoInfo.channelTitle,
        views: videoInfo.viewCount,
        publishedAt: videoInfo.publishedAt
      }
    };
  } catch (error) {
    console.error('コンテンツ生成エラー:', error);
    throw new Error('コンテンツの生成に失敗しました');
  }
}

app.post('/api/generate', async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    
    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URLが必要です' });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: '有効なYouTube URLではありません' });
    }

    console.log('処理開始:', youtubeUrl);

    // 動画メタデータを取得
    const videoInfo = await getVideoMetadata(videoId);
    
    // コンテンツを生成
    const content = await generateContent(videoInfo);

    console.log('処理完了');

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('API エラー:', error);
    res.status(500).json({ 
      error: error.message || 'サーバーエラーが発生しました' 
    });
  }
});

app.post('/api/save', (req, res) => {
  try {
    const { content, filename } = req.body;
    
    if (!content || !filename) {
      return res.status(400).json({ error: 'コンテンツとファイル名が必要です' });
    }

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, `${filename}.txt`);
    fs.writeFileSync(filePath, content, 'utf8');

    res.json({
      success: true,
      message: `ファイルが保存されました: ${filename}.txt`,
      path: filePath
    });
  } catch (error) {
    console.error('ファイル保存エラー:', error);
    res.status(500).json({ 
      error: 'ファイルの保存に失敗しました' 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'サーバーは正常に動作しています' });
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
  console.log('YouTube Data API使用モードで動作中');
  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    console.log('⚠️  YOUTUBE_API_KEYが設定されていません。基本的なメタデータのみ使用します。');
  }
});