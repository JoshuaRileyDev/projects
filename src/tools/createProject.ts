import { getPreferenceValues } from "@raycast/api";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import Project from "../types/project";
import openProject from "./openProject";
import { createGitRepo } from "../utils/functions";
import { Template } from "../types/template";
import { getSlug } from "../utils/getSlug";

type Input = {
    /**
  * A unique name for the project, if not provided, the name should be randomly generated with lowercase letters and dashes
  */
    name: string;
    /**
  * The category of the project, use the getAllCategories tool to get a list of categories.
  */
    category: string;

    /**
     * Whether to create a git repository for the project. Default is false.
     */
    autoCreateRepo: boolean;

    /**
     * The template to use for the project, use the getAllTemplates tool to get the template from the list of templates.
     */
    template: Template;
}

export default async function createProject(input: Input) {
    const name = input.name;
    const category = input.category;
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

    
    if (input.template.command != "" && input.template.command != null && input.template.command != undefined) {
        const command = `/bin/zsh -ilc "${input.template.command.replaceAll('{projectName}', name).replaceAll('{projectSlug}', getSlug(name))}"`;
        const options = {
            cwd: projectPath,
            shell: "/bin/zsh",
        };
        execSync(command, options);
    }
    if (
        input.template.templatePath != "" &&
        input.template.templatePath != null &&
        input.template.templatePath != undefined
    ) {
        console.log("copying template");
        const templatePath = Array.isArray(input.template.templatePath) 
            ? input.template.templatePath[0] 
            : input.template.templatePath;
        fs.cpSync(templatePath, projectPath, { recursive: true });
        const files = fs.readdirSync(projectPath);
        const replaceInFile = (filePath: string) => {
            console.log("filePath", filePath);
            if (fs.statSync(filePath).isDirectory()) {
                console.log("isDirectory");
                const subFiles = fs.readdirSync(filePath);
                if (filePath.includes('{projectName}') || filePath.includes('{projectSlug}')) {
                    console.log("renaming directory");
                    const newName = filePath
                        .replaceAll('{projectName}', name)
                        .replaceAll('{projectSlug}', getSlug(name));
                    fs.renameSync(filePath, newName);
                }
                console.log("looping through subFiles");
                subFiles.forEach(subFile => {
                    console.log("directory subFile", subFile);
                    const subPath = path.join(filePath.replaceAll('{projectName}', name).replaceAll('{projectSlug}', getSlug(name)), subFile);
                    if (subFile.includes('{projectName}') || subFile.includes('{projectSlug}')) {
                        console.log("renaming");
                        const newName = subFile
                            .replaceAll('{projectName}', name)
                            .replaceAll('{projectSlug}', getSlug(name));
                        console.log("newName", newName);
                        fs.renameSync(subPath, path.join(filePath.replaceAll('{projectName}', name).replaceAll('{projectSlug}', getSlug(name)), newName));
                        replaceInFile(path.join(filePath.replaceAll('{projectName}', name).replaceAll('{projectSlug}', getSlug(name)), newName));
                    } else {
                        replaceInFile(subPath);
                    }
                });
            } else {
                console.log("isFile");
                let content = fs.readFileSync(filePath, 'utf8');
                const fileName = path.basename(filePath);
                let newPath = filePath;

                if (fileName.includes('{projectName}') || fileName.includes('{projectSlug}')) {
                    const newName = fileName
                        .replaceAll('{projectName}', name)
                        .replaceAll('{projectSlug}', getSlug(name));
                    newPath = path.join(path.dirname(filePath), newName);
                    fs.renameSync(filePath, newPath);
                }

                if (content.includes('{projectName}') || content.includes('{projectSlug}')) {
                    content = content
                        .replaceAll('{projectName}', name)
                        .replaceAll('{projectSlug}', getSlug(name));
                    fs.writeFileSync(newPath, content);
                }
            }
        };
        files.forEach(file => replaceInFile(path.join(projectPath, file)));
    }
    

    if (input.autoCreateRepo) {
        createGitRepo(project);
    }

    openProject({ project: project });

    if (input.template.setupCommand != "" && input.template.setupCommand != null && input.template.setupCommand != undefined) {
        const command = `/bin/zsh -ilc "${input.template.setupCommand.replaceAll('{projectName}', name).replaceAll('{projectSlug}', getSlug(name))}"`;
        const options = {
            cwd: projectPath,
            shell: "/bin/zsh",
        };
        execSync(command, options);
    }
}