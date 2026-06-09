# Environment Configuration

To run the server with Groq API, you need to set the following environment variable:

## Groq API Key
Set your Groq Console API key as an environment variable:

### For Windows PowerShell:
```powershell
$env:GROQ_API_KEY="your_groq_api_key_here"
```

### Or create a .env file:
```
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=development
PORT=5001
```

## How to get a Groq API Key:
1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign in with your account
3. Create a new API key
4. Copy the API key and use it in your environment

## Running the server:
```powershell
$env:NODE_ENV="development"
$env:GROQ_API_KEY="your_api_key_here"
npx tsx server/index.ts
```
