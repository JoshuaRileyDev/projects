import { execSync } from "child_process";

/**
 * Escapes a string for safe use in shell commands
 */
export function escapeShellArg(arg: string): string {
  // Replace single quotes with '\'' (end quote, escaped quote, start quote)
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

/**
 * Validates project names to ensure they're safe for file system operations
 */
export function validateProjectName(name: string): boolean {
  // Allow alphanumeric, hyphens, underscores, and dots
  // Disallow path traversal (..) and special shell characters
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  const hasPathTraversal = name.includes("..");
  const isEmpty = name.trim().length === 0;

  return validPattern.test(name) && !hasPathTraversal && !isEmpty;
}

/**
 * Validates GitHub URLs to ensure they're legitimate
 */
export function validateGitHubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "github.com" && parsed.pathname.length > 1 && !parsed.pathname.includes("..");
  } catch {
    return false;
  }
}

/**
 * Executes a command safely with proper argument escaping
 */
export function execCommand(command: string, args: string[], options?: { cwd?: string }): void {
  const escapedArgs = args.map(escapeShellArg);
  const fullCommand = `${command} ${escapedArgs.join(" ")}`;

  execSync(fullCommand, {
    cwd: options?.cwd,
    shell: "/bin/zsh",
    stdio: "pipe",
  });
}

/**
 * Safely executes git commands with proper argument escaping
 */
export function execGitCommand(subcommand: string, args: string[], options?: { cwd?: string }): void {
  const safeArgs = args.map(escapeShellArg);
  const command = `/bin/zsh -ilc 'git ${escapeShellArg(subcommand)} ${safeArgs.join(" ")}'`;

  execSync(command, {
    cwd: options?.cwd,
    shell: "/bin/zsh",
    stdio: "pipe",
  });
}
