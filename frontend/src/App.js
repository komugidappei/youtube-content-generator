import React, { useState } from 'react';
import axios from 'axios';
import { FaCopy, FaCheck, FaDownload } from 'react-icons/fa';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});
  const [saveMessage, setSaveMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post('/api/generate', {
        youtubeUrl: youtubeUrl.trim()
      });

      if (response.data.success) {
        setResults(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'エラーが発生しました');
    } finally {
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

  const saveToFile = async () => {
    if (!results) return;

    const allContent = `
【記事】
${results.article}

【Twitter/X投稿】
${results.twitter}

【Instagram投稿】
${results.instagram}

【タイトル案】
${results.titles}
`;

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `youtube-content-${timestamp}`;

      const response = await axios.post('/api/save', {
        content: allContent,
        filename: filename
      });

      if (response.data.success) {
        setSaveMessage('ファイルが正常に保存されました！');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (err) {
      setSaveMessage('ファイルの保存に失敗しました');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>📺 YouTube コンテンツジェネレーター</h1>
        <p>YouTube動画から記事とSNS投稿を自動生成</p>
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
              {loading ? '生成中...' : 'コンテンツを生成'}
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
            <span>動画を解析してコンテンツを生成しています...</span>
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
              <button className="save-btn" onClick={saveToFile}>
                <FaDownload style={{ marginRight: '5px' }} />
                全てのコンテンツをファイルに保存
              </button>
              {saveMessage && (
                <div className={saveMessage.includes('失敗') ? 'error' : 'success'} style={{ marginTop: '10px' }}>
                  {saveMessage}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;