# Devin-like AI Assistant Setup Instructions

This project has been set up with the [devin.cursorrules](https://github.com/grapeot/devin.cursorrules) configuration, which enhances Cursor with agentic AI capabilities. The following components have been installed and configured:

## Completed Setup

1. ✅ Repository files downloaded
2. ✅ Python virtual environment created
3. ✅ Dependencies installed in the virtual environment
4. ✅ Playwright browsers installed
5. ✅ Configuration files (.cursorrules and .env) set up

## Required Manual Configuration

To complete the setup and enable the full functionality, you need to:

1. **Enable YOLO Mode in Cursor**:
   - Click the gear icon in the top right corner of the Cursor interface
   - Navigate to the Features tab
   - Scroll down to "Enable Yolo Mode" and check the box
   - Optionally customize the Yolo Prompt for command execution

2. **Configure API Keys (Optional)**:
   If you want to use any of the LLM APIs, you'll need to add your API keys to the `.env` file. The file has been created with placeholders for:
   - OpenAI API key
   - Anthropic API key
   - DeepSeek API key
   - Google API key
   - Azure OpenAI API key

## Available Tools

This setup provides access to several useful tools:

1. **Web Scraping**:
   ```bash
   venv/bin/python3 ./tools/web_scraper.py --max-concurrent 3 URL1 URL2 URL3
   ```

2. **Search Engine**:
   ```bash
   venv/bin/python3 ./tools/search_engine.py "your search keywords"
   ```

3. **Screenshot Verification**:
   ```bash
   venv/bin/python3 tools/screenshot_utils.py URL [--output OUTPUT] [--width WIDTH] [--height HEIGHT]
   ```

4. **LLM API**:
   ```bash
   venv/bin/python3 ./tools/llm_api.py --prompt "Your question?" --provider "anthropic"
   ```

## Verification of Setup

All tools have been tested and are working correctly:

- ✅ **Search Engine**: Successfully returns search results for queries
- ✅ **Web Scraper**: Successfully fetches and displays web content
- ✅ **LLM API**: Set up correctly (requires valid API keys to function fully)

## Usage

You can now use Cursor with enhanced capabilities. Try asking complex tasks like:
- "Search for recent news about AI advancements"
- "Build a simple web app that displays weather data"
- "Create a data visualization for this dataset"

The AI will use the tools appropriately and maintain a record of lessons learned in the `.cursorrules` file.

## Virtual Environment

The project is set up with a Python virtual environment in the `venv` directory. Always activate this environment before running any Python commands:

```bash
source venv/bin/activate
```

This ensures that all dependencies are correctly used. 