import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  projectsFolder: string;
  coolifyToken?: string;
  coolifyUrl?: string;
}

type Input = {
  /**
   * A unique name for the project, if not provided, the name should be randomly generated with lowercase letters and dashes
   */
  name: string;
  /**
   * The description of the project
   */
  description: string;
};

export default async function createCoolifyProject(input: Input): Promise<string> {
  const { coolifyToken, coolifyUrl } = getPreferenceValues<Preferences>();

  if (!coolifyToken || !coolifyUrl) {
    throw new Error("Coolify token and URL must be configured in preferences");
  }

  const response = await fetch(`${coolifyUrl}/api/v1/projects`, {
    headers: {
      Authorization: `Bearer ${coolifyToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      description: input.description,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Coolify project: ${response.statusText}`);
  }

  const result = await response.json();
  return result.uuid;
}
