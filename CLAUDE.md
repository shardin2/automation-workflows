# Claude Code Project Guidelines

## Project Overview
This repository contains documentation and configurations for automation workflows, particularly n8n workflows integrated with various services.

## Key Areas

### n8n Workflows
- **Google Drive to Notion**: Automated file upload and tracking
- **Multi-source database support**: Working with Notion's new database model
- Expression syntax and API integration patterns

### Technologies
- n8n workflow automation
- Notion API v2022-06-28
- Google Drive API
- HTTP Request nodes for custom integrations

## Development Guidelines

### When Working with n8n
1. Always validate workflow configurations before claiming success
2. Use proper n8n expression syntax: `={{expression}}` not `{{ expression }}`
3. For JSON bodies with expressions, use `JSON.stringify()` with JavaScript object notation
4. Test with actual executions, check logs and outputs

### When Creating Documentation
1. Include real-world examples from working configurations
2. Document common mistakes and how to avoid them
3. Provide complete, copy-paste ready code samples
4. Reference official documentation sources

### Code Review Focus
- Verify expression syntax is correct
- Check for proper error handling
- Ensure sensitive data (API keys, tokens) are properly secured
- Validate that documentation matches actual implementation

## Communication Style
- Be direct and concise
- Show working examples
- Admit and correct mistakes quickly
- Focus on validation over assumptions