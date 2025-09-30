/**
 * Toggle MCP server enabled/disabled status
 * @param {Object} config - Configuration object
 * @param {string} serverName - Name of the server to toggle
 * @returns {Object} Updated configuration object
 */
function toggleServer(config, serverName) {
  // Initialize arrays if they don't exist
  if (!config.enabledMcpjsonServers) {
    config.enabledMcpjsonServers = [];
  }
  if (!config.disabledMcpjsonServers) {
    config.disabledMcpjsonServers = [];
  }

  // Check if server exists in mcpServers
  if (!config.mcpServers || !config.mcpServers[serverName]) {
    throw new Error(`Server "${serverName}" not found in mcpServers`);
  }

  const enabledIndex = config.enabledMcpjsonServers.indexOf(serverName);
  const disabledIndex = config.disabledMcpjsonServers.indexOf(serverName);

  // If in disabled array, move to enabled
  if (disabledIndex !== -1) {
    config.disabledMcpjsonServers.splice(disabledIndex, 1);
    if (!config.enabledMcpjsonServers.includes(serverName)) {
      config.enabledMcpjsonServers.push(serverName);
    }
    return { ...config, toggled: serverName, newStatus: 'enabled' };
  }

  // If in enabled array (or nowhere), move to disabled
  if (enabledIndex !== -1) {
    config.enabledMcpjsonServers.splice(enabledIndex, 1);
  }
  if (!config.disabledMcpjsonServers.includes(serverName)) {
    config.disabledMcpjsonServers.push(serverName);
  }
  return { ...config, toggled: serverName, newStatus: 'disabled' };
}

/**
 * Enable a specific MCP server
 * @param {Object} config - Configuration object
 * @param {string} serverName - Name of the server to enable
 * @returns {Object} Updated configuration object
 */
function enableServer(config, serverName) {
  if (!config.enabledMcpjsonServers) {
    config.enabledMcpjsonServers = [];
  }
  if (!config.disabledMcpjsonServers) {
    config.disabledMcpjsonServers = [];
  }

  // Remove from disabled array
  const disabledIndex = config.disabledMcpjsonServers.indexOf(serverName);
  if (disabledIndex !== -1) {
    config.disabledMcpjsonServers.splice(disabledIndex, 1);
  }

  // Add to enabled array if not already there
  if (!config.enabledMcpjsonServers.includes(serverName)) {
    config.enabledMcpjsonServers.push(serverName);
  }

  return config;
}

/**
 * Disable a specific MCP server
 * @param {Object} config - Configuration object
 * @param {string} serverName - Name of the server to disable
 * @returns {Object} Updated configuration object
 */
function disableServer(config, serverName) {
  if (!config.enabledMcpjsonServers) {
    config.enabledMcpjsonServers = [];
  }
  if (!config.disabledMcpjsonServers) {
    config.disabledMcpjsonServers = [];
  }

  // Remove from enabled array
  const enabledIndex = config.enabledMcpjsonServers.indexOf(serverName);
  if (enabledIndex !== -1) {
    config.enabledMcpjsonServers.splice(enabledIndex, 1);
  }

  // Add to disabled array if not already there
  if (!config.disabledMcpjsonServers.includes(serverName)) {
    config.disabledMcpjsonServers.push(serverName);
  }

  return config;
}

/**
 * Enable all MCP servers
 * @param {Object} config - Configuration object
 * @returns {Object} Updated configuration object
 */
function enableAll(config) {
  if (!config.mcpServers) {
    return config;
  }

  config.enabledMcpjsonServers = Object.keys(config.mcpServers);
  config.disabledMcpjsonServers = [];

  return config;
}

/**
 * Disable all MCP servers
 * @param {Object} config - Configuration object
 * @returns {Object} Updated configuration object
 */
function disableAll(config) {
  if (!config.mcpServers) {
    return config;
  }

  config.disabledMcpjsonServers = Object.keys(config.mcpServers);
  config.enabledMcpjsonServers = [];

  return config;
}

module.exports = {
  toggleServer,
  enableServer,
  disableServer,
  enableAll,
  disableAll
};