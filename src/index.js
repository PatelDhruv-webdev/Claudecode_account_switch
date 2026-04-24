import {
  cmdSetup,
  cmdAdd,
  cmdList,
  cmdRemove,
  cmdUninstall,
  cmdHelp,
} from './commands.js';

export async function run(argv) {
  const [command, ...args] = argv;

  try {
    switch (command) {
      case 'setup':
      case 'install':
        await cmdSetup();
        break;
      case 'add':
      case 'new':
      case 'create':
        await cmdAdd(args);
        break;
      case 'list':
      case 'ls':
        await cmdList();
        break;
      case 'remove':
      case 'delete':
      case 'rm':
        await cmdRemove(args);
        break;
      case 'uninstall':
        await cmdUninstall();
        break;
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        await cmdHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run: claude-multi help');
        process.exit(1);
    }
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      console.log('\nCancelled.');
      process.exit(0);
    }
    throw error;
  }
}
