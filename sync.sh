aws s3 sync . s3://warot-photo-demo-2024-aug --delete --exclude ".git/*" --exclude ".git/*" --exclude "sync.sh"  --exclude ".gitignore"
aws cloudfront create-invalidation --distribution-id E29R9QF8KG9XN3 --paths "/*"


