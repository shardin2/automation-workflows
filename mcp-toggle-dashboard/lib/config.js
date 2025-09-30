const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.claude.json');
const BACKUP_PATH = path.join(os.homedir(), '.claude.json.backup');

/**
 * Read the Claude Code configuration file
 * @returns {Object} Parsed configuration object
 */
function readConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Config file not found at ${CONFIG_PATH}`);
    }
    throw new Error(`Failed to read config: ${error.message}`);
  }
}

/**
 * Write configuration back to file with backup
 * @param {Object} config - Configuration object to write
 */
function writeConfig(config) {
  try {
    // Create backup first
    if (fs.existsSync(CONFIG_PATH)) {
      fs.copyFileSync(CONFIG_PATH, BACKUP_PATH);
      console.log(`✓ Backup created at ${BACKUP_PATH}`);
    }

    // Write new config with proper formatting
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✓ Config updated at ${CONFIG_PATH}`);
  } catch (error) {
    throw new Error(`Failed to write config: ${error.message}`);
  }
}

/**
 * Get all MCP servers from config
 * @param {Object} config - Configuration object
 * @returns {Array} Array of server objects with name, config, and status
 */
function getAllServers(config) {
  const servers = [];
  const mcpServers = config.mcpServers || {};
  const enabled = config.enabledMcpjsonServers || [];
  const disabled = config.disabledMcpjsonServers || [];

  for (const [name, serverConfig] of Object.entries(mcpServers)) {
    servers.push({
      name,
      config: serverConfig,
      enabled: !disabled.includes(name)
    });
  }

  return servers;
}

/**
 * Validate config structure before writing
 * @param {Object} config - Configuration object to validate
 * @returns {boolean} True if valid
 */
function validateConfig(config) {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Config must be an object');
  }

  if (config.mcpServers && typeof config.mcpServers !== 'object') {
    throw new Error('mcpServers must be an object');
  }

  if (config.enabledMcpjsonServers && !Array.isArray(config.enabledMcpjsonServers)) {
    throw new Error('enabledMcpjsonServers must be an array');
  }

  if (config.disabledMcpjsonServers && !Array.isArray(config.disabledMcpjsonServers)) {
    throw new Error('disabledMcpjsonServers must be an array');
  }

  return true;
}

module.exports = {
  CONFIG_PATH,
  BACKUP_PATH,
  readConfig,
  writeConfig,
  getAllServers,
  validateConfig
};