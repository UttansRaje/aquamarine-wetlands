# Aquamarine Gemini AI: Netlify deployment

The site uses a Netlify serverless function at `/api/ask` calling Google's Gemini API. Your Gemini API key stays server-side.

## Deploy

1. Extract this ZIP into a folder. Do not upload it through ordinary Netlify Drop: that only deploys static files, not the AI function.
2. Use a Git-connected Netlify project (upload extracted files to the repository) OR install Node.js and Netlify CLI (`npm install -g netlify-cli`), then in the extracted folder run `netlify login` and `netlify deploy --prod --dir . --functions netlify/functions`.
3. In Netlify > Project configuration > Environment variables, ensure `GEMINI_API_KEY` is present with Functions scope and the Production deploy context. It must contain a valid Google Gemini API key, not an OpenAI key.
4. Redeploy the project after updating variables. The function defaults to model `gemini-2.5-flash`. Optionally set `GEMINI_MODEL` if that model is unavailable for your account.
5. Open your site and ask `What is rain?` or `wht is rian?`.

## If the fallback still appears

- Open `https://YOUR-SITE.netlify.app/.netlify/functions/ask` in a browser. A deployed function should respond with JSON `Use POST.` and HTTP 405. A 404 means the function was not deployed.
- In Netlify > Logs > Functions, inspect the `ask` function for API errors. A 429 means a Gemini usage/quota limit; 502 may indicate invalid key, unavailable model, or provider failure.
- Do not paste your API key into HTML, app.js, Git, or chat. Set spending/usage limits and abuse protections before inviting public traffic.
