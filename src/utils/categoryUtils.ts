import fs from "fs";
import path from "path";
import { LocalStorage, showToast, Toast } from "@raycast/api";
import { Category, CategoryType } from "../types/category";
import { Template, TemplateType } from "../types/template";
import { generateRandomId } from "./generateRandomId";

/**
 * Creates categories automatically from existing subfolders in the projects directory
 * Also detects example folders and creates default templates
 *
 * @param projectsFolder - Path to the main projects directory
 * @returns Array of Category objects with auto-detected template paths
 *
 * Behavior:
 * - Scans all subdirectories in the projects folder
 * - Skips hidden folders (starting with .) and node_modules
 * - For each valid folder, creates a category with:
 *   - Name: Capitalized folder name
 *   - Type: template-based category
 *   - Default app: Visual Studio Code
 * - Searches for "example" folder (case-insensitive) in each category
 * - If found, sets templatePath and creates a "Default" template
 * - Templates are automatically saved to LocalStorage
 *
 * Example folder structure:
 * /Projects/
 * ├── web-apps/
 * │   ├── example/         <- Creates template from this folder
 * │   ├── my-site/
 * │   └── other-project/
 * ├── mobile-apps/
 * │   ├── Example/         <- Also detects capitalized version
 * │   └── my-app/
 * └── cli-tools/           <- No example folder, no template created
 */
export async function createCategoriesFromSubfolders(projectsFolder: string): Promise<Category[]> {
  const categories: Category[] = [];
  const templatesToCreate: Template[] = [];

  if (!fs.existsSync(projectsFolder)) {
    return categories;
  }

  const subfolders = fs
    .readdirSync(projectsFolder, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const folderName of subfolders) {
    // Skip hidden folders and common non-project directories
    if (folderName.startsWith(".") || folderName === "node_modules") {
      continue;
    }

    const categoryPath = path.join(projectsFolder, folderName);
    let templatePath = "";

    // Check for example folder (case-insensitive)
    try {
      const folderContents = fs.readdirSync(categoryPath, { withFileTypes: true });
      const exampleFolder = folderContents.find((item) => item.isDirectory() && item.name.toLowerCase() === "example");

      if (exampleFolder) {
        templatePath = path.join(categoryPath, exampleFolder.name);
      }
    } catch (error) {
      // If we can't read the category folder, skip template detection but continue with category creation
      console.warn(`Could not read category folder ${categoryPath}:`, error);
    }

    const categoryName = folderName.charAt(0).toUpperCase() + folderName.slice(1);

    const category: Category = {
      name: categoryName,
      folderName: folderName,
      imagePath: "🗂️", // Default folder icon
      defaultAppPath: "/Applications/Visual Studio Code.app", // Default to VS Code
      type: "template" as CategoryType,
      command: "",
      templatePath: templatePath,
      autoCreateRepo: false,
      setupCommand: "",
    };

    categories.push(category);

    // Create a default template if example folder exists
    if (templatePath) {
      const template: Template = {
        id: generateRandomId(),
        name: "Default",
        category: categoryName,
        imagePath: "📋",
        type: "template" as TemplateType,
        command: "",
        templatePath: templatePath,
        setupCommand: "",
        autoCreateRepo: false,
      };

      templatesToCreate.push(template);
    }
  }

  // Save templates if any were created
  if (templatesToCreate.length > 0) {
    await saveTemplatesToStorage(templatesToCreate);
  }

  return categories;
}

/**
 * Saves templates to LocalStorage, merging with existing templates
 */
async function saveTemplatesToStorage(newTemplates: Template[]): Promise<void> {
  try {
    const existingTemplatesData = await LocalStorage.getItem("templates");
    const existingTemplates: Template[] = existingTemplatesData ? JSON.parse(existingTemplatesData as string) : [];

    const allTemplates = [...existingTemplates, ...newTemplates];
    await LocalStorage.setItem("templates", JSON.stringify(allTemplates));
  } catch (error) {
    console.error("Failed to save templates:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Template Creation Failed",
      message: "Could not save default templates",
    });
  }
}

/**
 * Loads categories from storage or creates them from existing subfolders if none exist
 */
export async function loadCategoriesWithAutoCreation(projectsFolder: string): Promise<Category[]> {
  const storedCategories = await LocalStorage.getItem("categories");

  let parsedCategories: Category[] = [];

  if (storedCategories) {
    parsedCategories = JSON.parse(storedCategories as string);
  } else {
    // No categories exist, create them from existing subfolders
    parsedCategories = await createCategoriesFromSubfolders(projectsFolder);

    if (parsedCategories.length > 0) {
      // Save the auto-generated categories
      await LocalStorage.setItem("categories", JSON.stringify(parsedCategories));

      // Count categories with templates
      const categoriesWithTemplates = parsedCategories.filter((cat) => cat.templatePath).length;

      let message = `Created ${parsedCategories.length} categories from existing folders`;
      if (categoriesWithTemplates > 0) {
        message += ` (${categoriesWithTemplates} with templates)`;
      }

      showToast({
        style: Toast.Style.Success,
        title: "Setup Complete",
        message: message,
      });
    }
  }

  return parsedCategories;
}
