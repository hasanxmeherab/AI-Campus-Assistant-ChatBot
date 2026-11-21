# DIU Campus Assistant

The project foundation connects a React and Tailwind CSS interface to a Node.js and Express API backed by MongoDB. The local page shows the result of a real MongoDB ping through the API.

## Run locally

1. Install Node.js 24 or newer and make a MongoDB instance available.
2. Run `npm ci`.
3. Run `npm run dev` and open [http://127.0.0.1:5173](http://127.0.0.1:5173).

The API listens on port 3001 and uses local MongoDB at `127.0.0.1:27017` by default. To customize the API port, MongoDB URI, or database name, copy `.env.example` to `.env` at the project root. Keep connection credentials in the ignored `.env` file or the server environment.

## Verify the connection

Open the local page and select **Check connection**. A working setup displays **Online** for Express and **Connected** for MongoDB. You can also call `GET /api/health`. It returns HTTP 200 when MongoDB responds and HTTP 503 when the API cannot reach MongoDB.

To run the built frontend through Express, run `npm run build` and then `npm start`. Open [http://127.0.0.1:3001](http://127.0.0.1:3001) or use the port configured in `.env`.
