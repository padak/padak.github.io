# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is an educational web application repository ("Terka – rodinná cvičení") for Czech and English language exercises, hosted on GitHub Pages at https://padak.github.io/

## Architecture

### Data Structure
- **JSON data files**: Store exercise content separately from presentation
  - `cj/slovni_druhy_test.json`: 50 Czech sentences with word categorization into 10 parts of speech
  - `en/english_tenses_test.json`: 100 English sentences for Present Simple vs Present Continuous practice

### HTML Applications
Each exercise has two versions:
- **Desktop version**: Full-featured with sidebar guides
- **Mobile version** (`-mobile.html` or `-mobil.html`): Touch-optimized with collapsible guides

All HTML files are self-contained with inline CSS and JavaScript, loading data from JSON files via fetch API.

## Development Commands

### Local Testing
```bash
# Serve files locally (required for JSON loading due to CORS)
python3 -m http.server
# Then open: http://localhost:8000/cj/slovni-druhy-test.html
```

### Deployment
```bash
# Files are served directly via GitHub Pages
git add .
git commit -m "Update exercises"
git push origin main
# Access at: https://padak.github.io/[path]
```

## Key Implementation Patterns

### Adding New Exercises
1. Create JSON data file with exercise content following existing structure:
   - Include sentence/question, options, correct answer, hints
   - Use consistent ID system for tracking
2. Create HTML file(s) that:
   - Load data via fetch from relative JSON path
   - Handle CORS errors with helpful message about local server
   - Implement immediate feedback on user selection
   - Track score and show final results

### Mobile Optimization
Mobile versions should:
- Use larger touch targets (min 44x44px)
- Implement collapsible guides with details/summary elements
- Grid layout for options (2 columns on mobile)
- Simplified feedback messages

## File Naming Conventions
- Czech content: `cj/` directory
- English content: `en/` directory
- Mobile versions: append `-mobile` or `-mobil` to filename
- Data files: `_test.json` suffix