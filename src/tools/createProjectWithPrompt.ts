import { getPreferenceValues, LocalStorage } from "@raycast/api";
import path from "path";
import fs from "fs";
import { execSync, spawn } from "child_process";
import Project from "../types/project";
import { Category } from "../types/category";
import openProject from "./openProject";
import { createGitRepo } from "../utils/functions";
import { waitUntilAppIsOpen } from "../utils/waitUntilAppOpen";
import { validateProjectName, escapeShellArg } from "../utils/security";

type Input = {
  /**
   * A unique name for the project, if not provided, the name should be randomly generated with lowercase letters and dashes
   */
  name: string;
  /**
   * The category of the project, use the getAllCategories tool to get a list of categories
   */
  category: string;

  /**
   * The prompt to use to create the project, create a detailed plan and specification for the project from this prompt
   */
  prompt: string;
};

function escapeAppleScriptText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function typeAndEnter(promptText: string) {
  const escapedText = escapeAppleScriptText(promptText);
  const appleScript = [
    'tell application "System Events"',
    `    keystroke "${escapedText}"`,
    "    delay 1.0", // delay to ensure that keystrokes are processed
    "    keystroke return",
    "end tell",
  ].join("\n");

  // Use /usr/bin/osascript, which is the usual location on macOS.
  const command = "/usr/bin/osascript";
  const args = ["-e", appleScript];

  const child = spawn(command, args, {
    shell: false, // no extra wrapping shell is needed
    stdio: "inherit",
  });

  child.on("error", (err) => {
    console.error("Failed to run command:", err);
  });
}

export default async function createProject(input: Input) {
  const name = input.name;
  const category = input.category;

  // Validate project name for security
  if (!validateProjectName(name)) {
    throw new Error(
      "Project name contains invalid characters. Only alphanumeric characters, hyphens, underscores, and dots are allowed.",
    );
  }

  const preferences = getPreferenceValues<Preferences>();
  const categoryPath = path.join(preferences.projectsFolder, category);
  const projectPath = path.join(categoryPath, name);

  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }

  fs.mkdirSync(projectPath, { recursive: true });

  const project: Project = {
    name: name,
    categoryName: category,
    fullPath: projectPath,
    aliases: [],
  };

  const categoriesString = (await LocalStorage.getItem<string>("categories")) || "[]";
  const categories = JSON.parse(categoriesString || "[]") as Category[];
  const categoryDetails = categories.find((c: Category) => c.name === category);

  if (categoryDetails) {
    if (categoryDetails.command != "" && categoryDetails.command != null && categoryDetails.command != undefined) {
      const escapedCommand = escapeShellArg(categoryDetails.command);
      const command = `/bin/zsh -ilc ${escapedCommand}`;
      const options = {
        cwd: projectPath,
        shell: "/bin/zsh",
      };
      execSync(command, options);
    }
    if (
      categoryDetails.templatePath != "" &&
      categoryDetails.templatePath != null &&
      categoryDetails.templatePath != undefined
    ) {
      fs.cpSync(categoryDetails.templatePath, projectPath, { recursive: true });
    }
  }

  if (categoryDetails?.autoCreateRepo) {
    createGitRepo(project);
  }

  openProject({ project: project });
  console.log("Waiting for app to open");
  if (categoryDetails?.defaultAppPath) {
    waitUntilAppIsOpen(categoryDetails.defaultAppPath, () => {
      console.log("App is open");
      setTimeout(() => {
        typeAndEnter(input.prompt);
      }, 3000);
    });
  }
}
