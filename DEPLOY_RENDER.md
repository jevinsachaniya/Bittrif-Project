# Deploy Bittrif Group of Company on Render

This project deploys as one Render Python web service. FastAPI serves the API, uploaded images, and the built React website from the same domain.

## Before Deploying

1. Push this project to a GitHub repository.
2. In Render, select **New +** then **Blueprint**.
3. Select the repository. Render will read `render.yaml`.
4. Keep the configured **Starter** plan. The site uses SQLite and product-image uploads, so it needs the attached 1 GB persistent disk.
5. Create the service and wait for the first build to finish.

## Render Configuration

- Build command: `pip install -r backend/requirements.txt && cd client && npm ci && npm run build`
- Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check: `/api/health`
- Persistent disk: `/var/data`

Do not deploy the root `server.js`. It is a legacy local server. The active production app is `backend/main.py` plus `client/`.

## Persistent Data

The persistent disk stores:

- `bittrif.db` for products, customers, and orders
- `uploads/` for images added from the Admin Product page

Without a persistent disk, Render can discard SQLite data and uploaded product images whenever a service instance is replaced.

## Environment Variables

Render sets `PORT` automatically. Do not add it manually.

- `DATA_DIR=/var/data` is included in `render.yaml`.
- `CORS_ORIGINS` is only needed if a separate frontend domain will call this API. Use comma-separated origins, for example `https://www.example.com,https://example.com`.

For local overrides, copy `backend/.env.example` to `backend/.env`.

## After Deploying

1. Open `https://YOUR-SERVICE.onrender.com/api/health`. It should return `{ "status": "ok" }`.
2. Open the service root URL and test product browsing, login, checkout, and Admin Product image upload.
3. Add your custom domain from the Render dashboard, then update `CORS_ORIGINS` only if another domain directly calls the API.

## Security Note

The current admin area does not yet enforce server-side role authorization. Before sharing the public URL broadly, add admin authentication/roles so product and order management endpoints are not publicly writable.
