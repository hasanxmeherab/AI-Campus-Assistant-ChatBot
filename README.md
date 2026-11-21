# DIU Campus Assistant

The project foundation connects a React and Tailwind CSS interface to a Node.js and Express API backed by MongoDB. The local page shows the result of a real MongoDB ping through the API.

## Run locally

1. Install Node.js 24 or newer and make a MongoDB instance available.
2. Run `npm ci` at the project root to install dependencies for both npm workspaces.
3. Open two terminals at the project root and run one command block in each.

**Terminal 1 · Express API**

```powershell
cd server
npm start
```

**Terminal 2 · React frontend**

```powershell
cd client
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite forwards frontend API requests to the separately running Express server. If you have a dev session running from before the split, stop it with Ctrl+C before using the two terminals.

The API listens on port 3001 and uses local MongoDB at `127.0.0.1:27017` by default. To customize the API port, MongoDB URI, or database name, copy `.env.example` to `.env` at the project root or use `server/.env`. Shell environment variables take priority, then the root `.env`, then `server/.env`. Restart the running processes after changing these settings.

## Verify the connection

Open the local page and select **Check connection**. A working setup displays **Online** for Express and **Connected** for MongoDB. You can also call `GET /api/health`. It returns HTTP 200 when MongoDB responds and HTTP 503 when the API cannot reach MongoDB.

To serve a production build through Express, run `npm run build` in `client` while the API is running. Open [http://127.0.0.1:3001](http://127.0.0.1:3001) or use the configured API port.

## Import and search the DIU PDF

1. With MongoDB running, run `npm run import:pdf` at the project root or in `server` to import `info/diu_knowledge_base.pdf`.
2. Start the API and frontend in their own terminals as shown above.
3. Open [the library search example](http://127.0.0.1:5173/api/search?q=What%20are%20the%20library%20hours%3F) or call `GET /api/search?q=<English question>`.

The import stores excerpts with their PDF page numbers and any source URLs printed in the excerpt. Reimporting a file with the same filename replaces its previous passages after extraction succeeds. To import another text-based PDF, run `npm run import:pdf -- "path/to/document.pdf"`.

Search returns up to three ranked English keyword matches. The bundled PDF is a partial website compilation. Treat results as excerpts to verify against the source, especially for fees, deadlines, and eligibility. Embeddings and generated answers are separate milestones.
