import fs from "fs";
import { LocalStorage, showToast, Toast } from "@raycast/api";
import { Category, CategoryType } from "../types/category";

/**
 * Creates categories automatically from existing subfolders in the projects directory
 */
export async function createCategoriesFromSubfolders(projectsFolder: string): Promise<Category[]> {
  const categories: Category[] = [];

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

    const category: Category = {
      name: folderName.charAt(0).toUpperCase() + folderName.slice(1), // Capitalize first letter
      folderName: folderName,
      imagePath: "🗂️", // Default folder icon
      defaultAppPath: "/Applications/Visual Studio Code.app", // Default to VS Code
      type: "template" as CategoryType,
      command: "",
      templatePath: "",
      autoCreateRepo: false,
      setupCommand: "",
    };

    categories.push(category);
  }

  return categories;
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

      showToast({
        style: Toast.Style.Success,
        title: "Categories Created",
        message: `Created ${parsedCategories.length} categories from existing folders`,
      });
    }
  }

  return parsedCategories;
}
