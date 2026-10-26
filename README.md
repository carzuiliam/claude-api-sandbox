# Claude API Playground

This project is a sandbox I use to study the Claude API. It contains a simple chat interface, built in React, which talks to Claude through the official Anthropic SDK.

## Utilized Material

- **React** with **TypeScript**, used to build the chat interface;
- **Vite**, used as the dev server, including a proxy that keeps the API key out of the browser;
- **Material UI** with **tss-react**, used for components and styling;
- **Anthropic SDK** (`@anthropic-ai/sdk`), used to call the Claude API.

## How to Run

1. Install the dependencies with `npm install`;
2. Copy `.env.example` to `.env` and fill in your `ANTHROPIC_API_KEY`;
3. Run `npm start`. The chat opens at `http://localhost:3000`.

## Additional Info

This project will always be under construction, since it follows my studies. Don't worry if anything on it changes. 😅

## License

The available source codes here are under the MIT License (see the attached `LICENSE` file for more details). Any questions can be submitted to my email: carloswilldecarvalho@outlook.com.
