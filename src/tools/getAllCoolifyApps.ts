import { getPreferenceValues } from "@raycast/api";
import CoolifyApp from "../types/coolifyApp";

interface Preferences {
  projectsFolder: string;
  coolifyToken?: string;
  coolifyUrl?: string;
}

export default async function getAllCoolifyApps(): Promise<CoolifyApp[]> {
  const { coolifyToken, coolifyUrl } = getPreferenceValues<Preferences>();

  if (!coolifyUrl || !coolifyToken) {
    return [];
  }

  try {
    const response = await fetch(`${coolifyUrl}/api/v1/applications`, {
      headers: {
        Authorization: `Bearer ${coolifyToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Coolify API error: ${response.statusText}`);
    }

    const coolifyApps = await response.json();
    return Array.isArray(coolifyApps) ? coolifyApps : [];
  } catch (error) {
    console.error("Error fetching Coolify apps:", error);
    return [];
  }
}
