# DIU Campus Assistant

The DIU Campus Assistant is an English chat interface built with React, Tailwind CSS, Node.js, Express, and MongoDB. It answers from imported university documents and shows the supporting PDF page.

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

Open [the API health endpoint](http://127.0.0.1:3001/api/health). It returns HTTP 200 when MongoDB responds and HTTP 503 when the API cannot reach MongoDB.

To serve a production build through Express, run `npm run build` in `client` while the API is running. Open [http://127.0.0.1:3001](http://127.0.0.1:3001) or use the configured API port.

## Import and search the DIU PDF

1. With MongoDB running, run `npm run import:pdf` at the project root or in `server` to import `info/diu_knowledge_base.pdf`.
2. Start the API and frontend in their own terminals as shown above.
3. Open [the library search example](http://127.0.0.1:5173/api/search?q=What%20are%20the%20library%20hours%3F) or call `GET /api/search?q=<English question>`.

The import stores excerpts with their PDF page numbers and any source URLs printed in the excerpt. Reimporting a file with the same filename replaces its previous passages after extraction succeeds. To import another text-based PDF, run `npm run import:pdf -- "path/to/document.pdf"`.

Search returns up to three ranked English keyword matches. The bundled PDF is a partial website compilation. Verify time-sensitive information such as fees and deadlines against the official sources.

## Try the chat

After importing the PDF, open [the frontend](http://127.0.0.1:5173) and select a suggested question or enter your own. Cited answers show the PDF page and a source excerpt. The chat also provides links to the original DIU sources when they are present in the PDF.

`POST /api/chat` accepts a JSON object with a `question` string of up to 300 characters. Chat messages are kept in the open tab, and each question is answered independently.

## Enable AI answers

1. Create an API key in your [OpenAI Platform project](https://platform.openai.com/api-keys).
2. Add `OPENAI_API_KEY` to `server/.env`. The default model is `gpt-4.1-mini`. Set `OPENAI_MODEL` to use a different model that supports Structured Outputs in the Responses API.
3. Restart Express, then try “What time does the library close on Fridays?” in the chat.

With a key, the backend sends questions and relevant document excerpts to OpenAI. It combines embedding similarity with keyword search and asks the model to answer only from the retrieved passages. The backend checks that citations quote those passages and that numeric values appear in the cited excerpts. The first question embeds the document collection, and the server reuses those vectors until the indexed text changes or Express restarts. OpenAI API usage is billed to the configured project. See the [API quickstart](https://developers.openai.com/api/docs/quickstart).

Without a key, or if the AI request fails, the existing document-search answer is used and the chat identifies that fallback. The server logs the category of AI errors for troubleshooting.
