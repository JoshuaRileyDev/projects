import { getPreferenceValues } from "@raycast/api";
import CoolifyProject from "./../types/coolifyProject";

interface Preferences {
  projectsFolder: string;
  coolifyToken?: string;
  coolifyUrl?: string;
}

export default async function getAllCoolifyProjects(): Promise<CoolifyProject[]> {
  const { coolifyToken, coolifyUrl } = getPreferenceValues<Preferences>();

  if (!coolifyUrl || !coolifyToken) {
    return [];
  }

  try {
    const response = await fetch(`${coolifyUrl}/api/v1/projects`, {
      headers: {
        Authorization: `Bearer ${coolifyToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Coolify API error: ${response.statusText}`);
    }

    const coolifyProjects = await response.json();
    return Array.isArray(coolifyProjects) ? coolifyProjects : [];
  } catch (error) {
    console.error("Error fetching Coolify projects:", error);
    return [];
  }
}
