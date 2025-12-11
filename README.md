<div align="center">
  <img src="./public/icon-512.png" alt="Parsley Logo" width="80" height="80" />

  <h1>Parsley</h1>
  <p>Turn any document into structured data, instantly</p>
    <a href="https://github.com/bgwastu/parsley/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/bgwastu/parsley"></a>
  <a href=""><img alt="GitHub" src="https://img.shields.io/github/license/bgwastu/parsley"></a>

</div>

## What is Parsley?

Parsley is an AI-powered document parser that transforms PDFs or images into structured JSON or CSV data. It uses vision-capable AI models to understand document content and extract information according to your custom schema.

It's perfect for automation workflows, data extraction pipelines, and no-code tools like n8n.

## Core Features

- **Document Processing**: Supports PDF (with password protection) and images (PNG, JPEG, WebP)
- **Custom Schemas**: Define your own data structure or let AI generate it automatically
- **Multiple AI Providers**: Use Google Gemini or OpenRouter with your own API keys
- **Demo Mode**: Try it instantly with rate-limited free tier (no API key required)
- **Dual Output Formats**: Export as JSON or CSV for maximum flexibility
- **API-First Design**: Stateless endpoints perfect for automation tools
- **Security**: Built-in rate limiting, bot protection, and secure file handling

## API Endpoints

### Parse Document

```bash
POST /api/parse
Content-Type: multipart/form-data

# Required fields:
- file: Document file (PDF or image)
- outputFormat: "json-object" | "json-array" | "csv"
- googleApiKey or openrouterApiKey: Your AI provider API key

# Optional fields:
- schema: Custom schema (auto-generated if not provided)
- pdfPassword: Password for encrypted PDFs
- startPage, endPage: PDF page range (optional)
```

## License

[MIT License](LICENSE)