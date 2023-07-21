## Deploy

Upload image

```bash
gcloud builds submit --tag gcr.io/r6-match-data-run/r6-match-data-service
```

Deploy Service

```bash
gcloud run deploy r6-match-data-service --image gcr.io/r6-match-data-run/r6-match-data-service --platform managed --allow-unauthenticated
```
