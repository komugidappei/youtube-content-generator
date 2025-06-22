#!/bin/bash

echo "🚀 GitHub Pages デプロイスクリプト"

# フロントエンドをビルド
cd frontend
echo "📦 フロントエンドをビルド中..."
npm run build

# gh-pagesブランチ用のディレクトリを作成
cd ..
mkdir -p gh-pages-deploy
cp -r frontend/build/* gh-pages-deploy/

# gh-pagesブランチに切り替え
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# 既存のファイルを削除して新しいビルドファイルをコピー
rm -rf *.html *.js *.css static/ 2>/dev/null
cp -r gh-pages-deploy/* .

# .gitignoreを一時的に無効化
mv .gitignore .gitignore.bak 2>/dev/null

# ビルドファイルをコミット
git add .
git commit -m "deploy: GitHub Pages 用ビルドファイル更新

🌐 自動生成されたビルドファイル
📦 React本番ビルド

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# GitHub Pagesにプッシュ
git push origin gh-pages

# 元のブランチに戻る
git checkout main
mv .gitignore.bak .gitignore 2>/dev/null

# 一時ディレクトリを削除
rm -rf gh-pages-deploy

echo "✅ デプロイ完了!"
echo "🌐 公開URL: https://komugidappei.github.io/youtube-content-generator"
echo "📝 GitHub Settings > Pages でGitHub Pagesを有効化してください"