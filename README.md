# DIU Campus Assistant

The DIU Admissions Guide includes a university overview, application instructions, a searchable FAQ, and official DIU resources. The homepage works with the frontend alone. Select **Ask Assistant** or visit `/#chat` to open the English campus chat, which uses Express and MongoDB to answer from imported university documents.

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

## Import the DIU knowledge base

Run `npm run import:diu_knowledge_base.json` from the project root or the `server` folder to load `info/diu_knowledge_base.json` into MongoDB. This adds campus information, an undergraduate program list, waiver notes, services, and contact details. Re-running the command replaces the previous import of this file.

To import a text-based PDF, run `npm run import:pdf -- "path/to/document.pdf"`. PDF imports retain source page numbers and any URLs in the excerpts.

With the API running, try the [library search example](http://127.0.0.1:5173/api/search?q=What%20are%20the%20library%20hours%3F). Search returns up to three ranked English keyword matches. Confirm time-sensitive information such as fees and deadlines with DIU.

## Import program fees

Run `npm run import:tuition` from the project root or the `server` folder to import `info/DIU_tuition_fees.json` into the same MongoDB search collection. Re-running the command updates the fee dataset after validation. The assistant uses these entries in place of the bundled PDF's sample fee table. The JSON includes unverified figures and incomplete breakdowns. Amounts are in BDT before waivers.

## Import admission requirements

Run `npm run import:admissions` from the project root or the `server` folder to import or update `info/admission_requirements.json`. The import keeps undergraduate and postgraduate requirements, applicant qualification types, and the online and in-person document checklists distinct. Programs flagged as unverified and fields left blank are marked accordingly.

## Try the chat

After importing the knowledge base, open [the campus assistant](http://127.0.0.1:5173/#chat) and select a suggested question or enter your own. Try “When does the library open?” and then “And on Fridays?” You can also ask general questions when an AI provider is configured. DIU answers use the imported material, and the API retains supporting citations for verification.

`POST /api/chat` accepts a `question` string of up to 4,000 characters and optional `history` ordered oldest first. Each history entry has a `role` of `user` or `assistant` and a `content` string. The tab keeps the transcript until reload or **New chat**. It sends up to 60 recent messages and 48,000 characters of history with each request.

## Enable AI answers

### Google Gemini

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Add `GEMINI_API_KEY=your_key_here` to `server/.env`. If you already keep your settings in the root `.env`, add it there instead. Keep the key in your server environment.
3. Restart Express with `npm start` from the project root and ask “What time does the library close on Fridays?” in the [campus chat](http://127.0.0.1:5173/#chat).

Gemini uses `gemini-3.1-flash-lite` for answers and `gemini-embedding-2` for document retrieval. Both have a free tier subject to project quotas. Set `GEMINI_MODEL` to choose a different Gemini text model with structured output support. [Gemini pricing](https://aistudio.google.com/docs/pricing)

### OpenAI

If `GEMINI_API_KEY` is empty, the server uses `OPENAI_API_KEY` when it is set. Create one in the [OpenAI Platform](https://platform.openai.com/api-keys) and add it to your server environment. The default model is `gpt-4.1-mini`. Set `OPENAI_MODEL` to use a different model that supports Structured Outputs in the Responses API. OpenAI API usage is billed to the configured project.

The configured provider receives the current question and recent conversation. For DIU questions it also receives DIU document text. The server reuses document embeddings until the indexed text changes or Express restarts, and checks the model's quotes and numeric values against the retrieved passages. Keep personal information out of demo questions, as Google may use free-tier inputs and outputs to improve its products. [Gemini API terms](https://aistudio.google.com/docs/terms)

If no AI key is configured or the configured provider fails or reaches its quota, the assistant uses local document search and labels the fallback. The server logs the provider and error category.
