# How it Works: Vercel Serverless Architecture

Here is how the application functions without a dedicated server:

```mermaid
sequenceDiagram
    participant Browser (React App)
    participant Vercel (Edge Network)
    participant Python Function (Serverless)
    participant Google (Gemini Web)

    Browser (React App)->>Vercel (Edge Network): POST /api/ask
    Note right of Browser (React App): Request is sent to relative path
    
    Vercel (Edge Network)->>Python Function (Serverless): Routes to api/index.py
    Note right of Vercel (Edge Network): Vercel spins up Python env<br/>Installs dependencies per requirements.txt
    
    Python Function (Serverless)->>Google (Gemini Web): Scrapes gemini.google.com
    Google (Gemini Web)-->>Python Function (Serverless): Returns AI Response
    
    Python Function (Serverless)-->>Vercel (Edge Network): Returns JSON
    Vercel (Edge Network)-->>Browser (React App): Forward Response
```

## Key Concepts

1.  **No Permanent Server**: Instead of a Python script running 24/7 on your computer or a VPS, Vercel creates a "Serverless Function" on demand.
2.  **Automatic Routing**: Vercel automatically looks at the `api/` folder. Any file there becomes an API endpoint. `api/index.py` handles requests to `/api/*`.
3.  **The "Scraper"**: The Python logic (copied from `Gemini3.py`) lives inside this serverless function. When a request comes in, it:
    *   Wakes up.
    *   Creates a fresh session with Google.
    *   Sends the prompt.
    *   Returns the result.
    *   Goes back to sleep (stops running).

## Deploying

Simply run `vercel` in your terminal (or connect your GitHub repo to Vercel). Vercel detects:
*   **Vite**: Builds your React frontend.
*   **Python**: Builds your API using `requirements.txt` and `api/index.py`.

It then serves both from the same URL (e.g., `https://your-app.vercel.app`).
