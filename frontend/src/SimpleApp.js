import React, { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

function SimpleApp() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const generateDemoContent = (videoId) => {
    // デモ用のサンプルコンテンツ
    return {
      article: `この動画（ID: ${videoId}）について魅力的な記事を作成しました。YouTube動画の内容を分析し、視聴者にとって価値のある情報を提供します。実際のサービスでは、OpenAI APIを使用して動画の実際の内容に基づいた詳細な記事を生成します。この記事は約800-1200文字で構成され、SEOに配慮したキーワードが含まれています。動画の見どころや重要なポイントを整理し、読みやすい形で紹介します。`,
      twitter: `🎥 注目のYouTube動画をチェック！興味深いコンテンツが満載です✨ #YouTube #動画 #おすすめ #${videoId.slice(0,6)}`,
      instagram: `📺 最新YouTube動画をシェア！🔥 みんなもチェックしてみてね💫 この動画は本当に面白い内容が盛りだくさん！✨ #YouTube #動画好き #シェア #おすすめ動画 #${videoId.slice(0,6)} #エンターテイメント #トレンド`,
      titles: `1. 「${videoId}から学ぶ！注目ポイント5選」\n2. 「話題のYouTube動画を徹底解説」\n3. 「見逃し厳禁！${videoId.slice(0,6)}の魅力」\n4. 「YouTube動画分析：${videoId}編」\n5. 「トレンド動画の裏側を探る」`,
      videoInfo: {
        title: `YouTube動画 (${videoId})`,
        channel: 'デモチャンネル',
        views: '1,000',
        publishedAt: new Date().toISOString()
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const videoId = extractVideoId(youtubeUrl.trim());
      
      if (!videoId) {
        throw new Error('有効なYouTube URLではありません');
      }

      // デモ用：実際のAPIの代わりにサンプルコンテンツを生成
      setTimeout(() => {
        const demoContent = generateDemoContent(videoId);
        setResults(demoContent);
        setLoading(false);
      }, 2000);

    } catch (err) {
      setError(err.message || 'エラーが発生しました');
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>📺 YouTube コンテンツジェネレーター</h1>
        <p>YouTube動画から記事とSNS投稿を自動生成（デモ版）</p>
        <div style={{marginTop: '10px', fontSize: '14px', opacity: 0.8}}>
          ⚠️ このデモ版では、サンプルコンテンツを表示します。<br/>
          完全版は OpenAI API を使用して実際の動画内容を分析します。
        </div>
      </header>

      <div className="main-content">
        <section className="input-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="youtube-url">YouTube動画のURL</label>
              <input
                type="url"
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>
            <button 
              type="submit" 
              className="generate-btn"
              disabled={loading || !youtubeUrl.trim()}
            >
              {loading ? '生成中...' : 'コンテンツを生成（デモ）'}
            </button>
          </form>

          {error && (
            <div className="error">
              {error}
            </div>
          )}
        </section>

        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>デモコンテンツを生成しています...</span>
          </div>
        )}

        {results && (
          <section className="results">
            <div className="result-section">
              <div className="result-header">
                <h3>📝 記事</h3>
                <button
                  className={`copy-btn ${copiedItems.article ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(results.article, 'article')}
                >
                  {copiedItems.article ? <FaCheck /> : <FaCopy />}
                  {copiedItems.article ? 'コピー済み' : 'コピー'}
                </button>
              </div>
              <div className="result-content">
                {results.article}
              </div>
            </div>

            <div className="result-section">
              <div className="result-header">
                <h3>🐦 Twitter/X投稿</h3>
                <button
                  className={`copy-btn ${copiedItems.twitter ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(results.twitter, 'twitter')}
                >
                  {copiedItems.twitter ? <FaCheck /> : <FaCopy />}
                  {copiedItems.twitter ? 'コピー済み' : 'コピー'}
                </button>
              </div>
              <div className="result-content">
                {results.twitter}
              </div>
            </div>

            <div className="result-section">
              <div className="result-header">
                <h3>📷 Instagram投稿</h3>
                <button
                  className={`copy-btn ${copiedItems.instagram ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(results.instagram, 'instagram')}
                >
                  {copiedItems.instagram ? <FaCheck /> : <FaCopy />}
                  {copiedItems.instagram ? 'コピー済み' : 'コピー'}
                </button>
              </div>
              <div className="result-content">
                {results.instagram}
              </div>
            </div>

            <div className="result-section">
              <div className="result-header">
                <h3>💡 タイトル案</h3>
                <button
                  className={`copy-btn ${copiedItems.titles ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(results.titles, 'titles')}
                >
                  {copiedItems.titles ? <FaCheck /> : <FaCopy />}
                  {copiedItems.titles ? 'コピー済み' : 'コピー'}
                </button>
              </div>
              <div className="result-content">
                {results.titles}
              </div>
            </div>

            <div className="save-section">
              <p style={{fontSize: '14px', color: '#666'}}>
                💡 完全版では、生成したコンテンツをファイルに保存することができます。
              </p>
            </div>
          </section>
        )}
      </div>

      <footer style={{textAlign: 'center', padding: '40px 20px', borderTop: '1px solid #eee', marginTop: '40px'}}>
        <p style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>
          🚀 このデモサイトは GitHub Pages でホストされています
        </p>
        <p style={{fontSize: '14px', color: '#666'}}>
          📁 完全版のソースコード: <a href="https://github.com/komugidappei/youtube-content-generator" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default SimpleApp;