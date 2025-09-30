# n8n Workflow Fix: Google Drive to Notion with Multi-Source Database Support

## Problem
The n8n Notion node doesn't support Notion's new multi-source database model which requires using `parent.data_source_id` instead of `parent.database_id` when creating pages.

## Solution
Use an HTTP Request node to directly call the Notion API with proper expression syntax.

## Key Learnings

### 1. n8n Expression Syntax
**Wrong:**
- `"{{ $json.name }}"` - Handlebars-style syntax doesn't work in n8n
- Expressions need the `=` prefix to evaluate

**Correct:**
- `={{$json.name}}` - Simple expression evaluation
- For JSON bodies, use `JSON.stringify()` with JavaScript object notation:

```javascript
={{ JSON.stringify({
  parent: {
    data_source_id: '27668cd3-1262-8075-a2f5-000b5a4b856e'
  },
  properties: {
    'Doc name': {
      title: [{
        text: {
          content: $json.name  // No quotes around expression
        }
      }]
    },
    File: {
      files: [{
        name: $json.name,
        external: {
          url: $json.webContentLink
        }
      }]
    }
  }
}) }}
```

### 2. HTTP Request Node Configuration
- **Headers:** Use `keypair` mode for better readability
- **Body:** Use `json` mode with `JSON.stringify()` for expressions
- Don't mix configuration modes (don't set both `jsonHeaders` and `headerParameters`)

### 3. Notion Multi-Source Databases
When creating pages in databases with multiple data sources:
1. Fetch the database using n8n Notion tools or API
2. Identify the correct `data_source_id` (format: `collection://UUID`)
3. Use `parent.data_source_id` instead of `parent.database_id` in API calls

### 4. File Attachments in Notion
External files can be attached using the `files` property with `external.url`:
```json
{
  "File": {
    "files": [{
      "name": "filename.txt",
      "external": {
        "url": "https://drive.google.com/uc?id=FILE_ID&export=download"
      }
    }]
  }
}
```

### 5. Testing & Validation
- Always validate configuration changes before claiming success
- Use n8n's validation tools to check workflow structure
- Test with actual executions, not just assumptions
- Check execution logs and actual outputs in Notion

## Working Configuration

### Workflow: GDrive to Notion with File Upload
**Workflow ID:** `REqxDUqLU22TgzCi`

**Node 1: Google Drive Trigger**
- Monitors folder: `1voc4NpOAcd0Em3yATlKZsnG6eCxamo1Q`
- Triggers on: `fileCreated`
- Poll frequency: Every minute

**Node 2: HTTP Request to Notion API**
```javascript
// Method: POST
// URL: https://api.notion.com/v1/pages

// Headers (keypair mode):
Authorization: Bearer YOUR_NOTION_API_KEY
Notion-Version: 2022-06-28
Content-Type: application/json

// Body (json mode):
={{ JSON.stringify({
  parent: {
    data_source_id: '27668cd3-1262-8075-a2f5-000b5a4b856e'
  },
  properties: {
    'Doc name': {
      title: [{
        text: {
          content: $json.name
        }
      }]
    },
    File: {
      files: [{
        name: $json.name,
        external: {
          url: $json.webContentLink
        }
      }]
    }
  }
}) }}
```

## Common Mistakes to Avoid
1. Using `{{ }}` syntax instead of `={{ }}`
2. Quoting expressions inside JavaScript objects (`"$json.name"` instead of `$json.name`)
3. Using `database_id` with multi-source databases
4. Mixing header/body configuration modes
5. Not testing before claiming success

## References
- n8n Expression Syntax: https://docs.n8n.io/code/expressions/
- Notion API Documentation: https://developers.notion.com/reference/post-page
- n8n HTTP Request Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/