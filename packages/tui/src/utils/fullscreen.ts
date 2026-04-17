const ENTER_ALT_SCREEN = '\x1b[?1049h\x1b[H\x1b[2J';
const EXIT_ALT_SCREEN = '\x1b[?1049l';

let entered = false;
let restoreOnSignalRegistered = false;

function writeExit() {
  if (!entered) return;
  process.stdout.write(EXIT_ALT_SCREEN);
  entered = false;
}

export function enterFullscreen(): void {
  if (entered) return;
  process.stdout.write(ENTER_ALT_SCREEN);
  entered = true;

  if (!restoreOnSignalRegistered) {
    restoreOnSignalRegistered = true;
    process.on('exit', writeExit);
    process.on('SIGINT', () => {
      writeExit();
      process.exit(130);
    });
    process.on('SIGTERM', () => {
      writeExit();
      process.exit(143);
    });
  }
}

export function exitFullscreen(): void {
  writeExit();
}
