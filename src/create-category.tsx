import { Form, ActionPanel, Action, showToast, LocalStorage, Toast } from "@raycast/api";
import { createCategoryFolder, ensureAllCategoryFolders } from "./utils/folders";
import { Category, CategoryType } from "./types/category";
import { useState } from "react";

export default function Command() {
  const [selectedType, setSelectedType] = useState<CategoryType>("command");
  async function handleSubmit(values: Category) {
    try {

      // Create folder for the new category
      await createCategoryFolder(values.name);

      // Get existing categories or initialize empty array
      const existingCategories = JSON.parse((await LocalStorage.getItem("categories")) || "[]");

      // Create folders for any existing categories that might be missing folders
      await ensureAllCategoryFolders(existingCategories);

      // Add new category
      const updatedCategories = [...existingCategories, values];

      // Save back to storage
      await LocalStorage.setItem("categories", JSON.stringify(updatedCategories));

      showToast({ title: "Category Created", message: "New category has been saved" });
    } catch (error) {
      showToast({
        title: "Error Creating Category",
        message: "Failed to save category",
        style: Toast.Style.Failure,
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Create a new category by filling out the details below." />
      <Form.TextField id="name" title="Category Name" placeholder="Enter category name" autoFocus />
      <Form.TextField id="folderName" title="Folder Name" placeholder="Enter folder name" />
      <Form.Dropdown id="type" title="Category Type" onChange={(newValue) => setSelectedType(newValue as CategoryType)}>
        <Form.Dropdown.Item value="command" title="Run a Command" icon="⌘" />
        <Form.Dropdown.Item value="template" title="Use a Template" icon="📄" />
      </Form.Dropdown>
      {selectedType === "command" && <Form.TextField id="command" title="Command" placeholder="Enter command" />}
      {selectedType === "template" && (
        <Form.FilePicker
          id="templatePath"
          title="Template Path"
          canChooseDirectories
          canChooseFiles={false}
          info="Select a template folder for the category"
        />
      )}
      <Form.FilePicker
        id="imagePath"
        title="Category Image"
        allowMultiple={false}
        type="public.image"
        info="Select an image file for the category"
      />
      <Form.FilePicker
        id="defaultAppPath"
        title="Default Application"
        allowMultiple={false}
        type="com.apple.application-bundle"
        info="Select the default application for this category"
      />
      <Form.Checkbox
        id="autoCreateRepo"
        label="Auto Create Repository"
        info="Automatically create a repository for the category"
      />
      <Form.TextField id="setupCommand" title="Setup Command" placeholder="Enter setup command" />
    </Form>
  );
}
