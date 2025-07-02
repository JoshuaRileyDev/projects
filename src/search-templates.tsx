import { List, ActionPanel, Action, Icon, showToast, Toast } from "@raycast/api";
import { LocalStorage } from "@raycast/api";
import { useState, useEffect } from "react";
import getCategories from "./tools/getCategories";
import getAllTemplates from "./tools/getAllTemplates";
import { Category } from "./types/category";
import { Template } from "./types/template";
import EditTemplateForm from "./forms/editTemplateForm";

export default function Command() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  useEffect(() => {
    getCategories().then(setCategories);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getAllTemplates().then(setTemplates);
  }, []);

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Category"
          value={selectedCategory || ""}
          onChange={(value) => {
            setSelectedCategory(value);
          }}
        >
          {categories.map((category) => (
            <List.Dropdown.Item
              key={category.name}
              title={category.name}
              value={category.name}
              icon={category.imagePath}
            />
          ))}
        </List.Dropdown>
      }
      onSearchTextChange={(text) => {
        setSearchText(text);
      }}
    >
      {templates
        .filter(
          (template) =>
            template.category === selectedCategory && template.name.toLowerCase().includes(searchText.toLowerCase()),
        )
        .map((template) => (
          <List.Item
            key={template.name}
            title={template.name}
            icon={template.type === "template" ? "📂" : "💻"}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Edit Template"
                  icon={Icon.Pencil}
                  target={<EditTemplateForm template={template} />}
                />
                <Action
                  title="Delete Template"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    try {
                      const existingTemplates = await getAllTemplates();
                      const updatedTemplates = existingTemplates.filter((t) => t.id !== template.id);
                      await LocalStorage.setItem("templates", JSON.stringify(updatedTemplates));
                      setTemplates(updatedTemplates);
                      await showToast({
                        title: "Template Deleted",
                        style: Toast.Style.Success,
                      });
                    } catch (error) {
                      await showToast({
                        title: "Failed to Delete Template",
                        style: Toast.Style.Failure,
                      });
                    }
                  }}
                />
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}
