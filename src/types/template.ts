export type TemplateType = "command" | "template";

export type Template = {
    id: string;
    name: string;
    category: string;
    type: TemplateType;
    command?: string;
    templatePath?: string;
    autoCreateRepo?: boolean;
    setupCommand?: string;
};
