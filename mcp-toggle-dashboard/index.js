#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const { readConfig, writeConfig, getAllServers, validateConfig } = require('./lib/config');
const { toggleServer, enableAll, disableAll } = require('./lib/toggle');

// Main menu options
const MENU_ACTIONS = {
  TOGGLE: 'toggle',
  ENABLE_ALL: 'enable_all',
  DISABLE_ALL: 'disable_all',
  VIEW_STATUS: 'view_status',
  EXIT: 'exit'
};

/**
 * Display current status of all MCP servers
 */
function displayStatus(servers) {
  console.log('\n' + chalk.bold.blue('═══ MCP Server Status ═══\n'));

  if (servers.length === 0) {
    console.log(chalk.yellow('No MCP servers found in config.'));
    return;
  }

  servers.forEach(server => {
    const status = server.enabled ? chalk.green('✓ ENABLED') : chalk.red('✗ DISABLED');
    console.log(`${status}  ${chalk.bold(server.name)}`);
  });

  console.log('');
}

/**
 * Toggle selected servers interactively
 */
async function toggleServersInteractive(config) {
  const servers = getAllServers(config);

  if (servers.length === 0) {
    console.log(chalk.yellow('No MCP servers found in config.'));
    return config;
  }

  displayStatus(servers);

  const { selectedServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedServers',
      message: 'Select servers to toggle (use spacebar to select, enter to confirm):',
      choices: servers.map(server => ({
        name: `${server.enabled ? '✓' : '✗'} ${server.name}`,
        value: server.name,
        checked: false
      }))
    }
  ]);

  if (selectedServers.length === 0) {
    console.log(chalk.yellow('No servers selected.'));
    return config;
  }

  // Toggle each selected server
  let updatedConfig = { ...config };
  const changes = [];

  selectedServers.forEach(serverName => {
    const result = toggleServer(updatedConfig, serverName);
    updatedConfig = result;
    changes.push({ name: serverName, status: result.newStatus });
  });

  // Confirm changes
  console.log('\n' + chalk.bold('Changes to be made:'));
  changes.forEach(change => {
    const statusColor = change.status === 'enabled' ? chalk.green : chalk.red;
    console.log(`  ${change.name} → ${statusColor(change.status.toUpperCase())}`);
  });

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Apply these changes?',
      default: true
    }
  ]);

  if (confirm) {
    validateConfig(updatedConfig);
    writeConfig(updatedConfig);
    console.log(chalk.green('\n✓ Changes applied successfully!'));
    console.log(chalk.yellow('⚠ Remember to restart Claude Code for changes to take effect.\n'));
  } else {
    console.log(chalk.yellow('Changes cancelled.'));
  }

  return updatedConfig;
}

/**
 * Main menu loop
 */
async function mainMenu() {
  console.clear();
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║   MCP Server Toggle Dashboard         ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════╝\n'));

  try {
    let config = readConfig();
    let running = true;

    while (running) {
      const servers = getAllServers(config);

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🔄 Toggle specific servers', value: MENU_ACTIONS.TOGGLE },
            { name: '✅ Enable all servers', value: MENU_ACTIONS.ENABLE_ALL },
            { name: '❌ Disable all servers', value: MENU_ACTIONS.DISABLE_ALL },
            { name: '📊 View current status', value: MENU_ACTIONS.VIEW_STATUS },
            { name: '🚪 Exit', value: MENU_ACTIONS.EXIT }
          ]
        }
      ]);

      switch (action) {
        case MENU_ACTIONS.TOGGLE:
          config = await toggleServersInteractive(config);
          break;

        case MENU_ACTIONS.ENABLE_ALL:
          displayStatus(servers);
          const { confirmEnableAll } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmEnableAll',
              message: 'Enable all MCP servers?',
              default: false
            }
          ]);
          if (confirmEnableAll) {
            config = enableAll(config);
            validateConfig(config);
            writeConfig(config);
            console.log(chalk.green('\n✓ All servers enabled!'));
            console.log(chalk.yellow('⚠ Remember to restart Claude Code for changes to take effect.\n'));
          }
          break;

        case MENU_ACTIONS.DISABLE_ALL:
          displayStatus(servers);
          const { confirmDisableAll } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmDisableAll',
              message: chalk.red('Disable all MCP servers?'),
              default: false
            }
          ]);
          if (confirmDisableAll) {
            config = disableAll(config);
            validateConfig(config);
            writeConfig(config);
            console.log(chalk.green('\n✓ All servers disabled!'));
            console.log(chalk.yellow('⚠ Remember to restart Claude Code for changes to take effect.\n'));
          }
          break;

        case MENU_ACTIONS.VIEW_STATUS:
          displayStatus(servers);
          await inquirer.prompt([
            {
              type: 'input',
              name: 'continue',
              message: 'Press enter to continue...'
            }
          ]);
          break;

        case MENU_ACTIONS.EXIT:
          running = false;
          console.log(chalk.cyan('\nGoodbye! 👋\n'));
          break;
      }

      // Reload config after each action
      if (running && action !== MENU_ACTIONS.VIEW_STATUS) {
        config = readConfig();
      }
    }
  } catch (error) {
    console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  mainMenu();
}

module.exports = { mainMenu };