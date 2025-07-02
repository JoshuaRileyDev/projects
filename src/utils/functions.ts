import { Toast, showToast, getPreferenceValues } from "@raycast/api";
import { execSync } from "child_process";
import path from "path";
import Project from "../types/project";
import fetch from "node-fetch";
import { validateProjectName, escapeShellArg } from "./security";

interface Preferences {
  projectsFolder: string;
  coolifyToken?: string;
  coolifyUrl?: string;
}

async function reinitGitRepo(project: Project) {
  const command = `/bin/zsh -ilc "rm -rf .git && git init"`;
  execSync(command, {
    cwd: project.fullPath,
    shell: "/bin/zsh",
  });
}

async function createGitRepo(project: Project, reinit: boolean = false, repoName: string = "") {
  showToast({
    style: Toast.Style.Animated,
    title: "Creating repository...",
  });
  if (reinit) {
    await reinitGitRepo(project);
  }

  const folderName = path.basename(project.fullPath);
  const name = repoName !== "" ? repoName : folderName;

  // Validate repository name for security
  if (!validateProjectName(name)) {
    throw new Error(
      "Repository name contains invalid characters. Only alphanumeric characters, hyphens, underscores, and dots are allowed.",
    );
  }

  const escapedName = escapeShellArg(name);
  const command = `/bin/zsh -ilc "git init && git add . && git commit -m 'Initial commit' && gh repo create ${escapedName} --private --source=. --push"`;

  const options = {
    cwd: project.fullPath,
    shell: "/bin/zsh",
  };

  try {
    execSync(command, options);
    showToast({
      style: Toast.Style.Success,
      title: "Repository setup completed",
      message: `Repository "${name}" has been created and pushed to GitHub.`,
    });
  } catch (execError) {
    console.error("Command execution failed:", execError);
    throw new Error(`Failed to setup repository: ${(execError as Error).message}`);
  }
}

async function getCoolifyProjects() {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.coolifyToken || !preferences.coolifyUrl) {
    throw new Error("Coolify token and URL must be configured in preferences");
  }

  const response = await fetch(`${preferences.coolifyUrl}/api/v1/projects`, {
    headers: {
      Authorization: `Bearer ${preferences.coolifyToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Coolify API error: ${response.statusText}`);
  }

  const data = await response.json();
  const newProject = {
    id: 0,
    uuid: "new",
    name: "Create New Project",
    description: "Create a new project in Coolify",
  };
  const projects = [newProject, ...(Array.isArray(data) ? data : [])];
  return projects;
}

async function createCoolifyProject(name: string) {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.coolifyToken || !preferences.coolifyUrl) {
    throw new Error("Coolify token and URL must be configured in preferences");
  }

  const response = await fetch(`${preferences.coolifyUrl}/api/v1/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${preferences.coolifyToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      description: "Created by Raycast Extension",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Coolify project: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function deployToCoolify(project: Project, coolifyProjectUUID: string) {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.coolifyToken || !preferences.coolifyUrl) {
    throw new Error("Coolify token and URL must be configured in preferences");
  }

  const response = await fetch(`${preferences.coolifyUrl}/api/v1/applications/private-github-app`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${preferences.coolifyToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_uuid: coolifyProjectUUID,
      git_repository: project.fullPath,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to deploy to Coolify: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export { reinitGitRepo, createGitRepo, getCoolifyProjects, createCoolifyProject };
