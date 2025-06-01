import { getPreferenceValues } from "@raycast/api";
import { LocalStorage } from "@raycast/api";
import CoolifyProject from "./../types/coolifyProject";

export default async function getAllCoolifyProjects(): Promise<CoolifyProject[]> {
    const { coolifyToken, coolifyUrl } = getPreferenceValues<Preferences>();
    const response = await fetch(`${coolifyUrl}/api/v1/projects`, {
        headers: {
            "Authorization": `Bearer ${coolifyToken}`
        }
    });
    const coolifyProjects = await response.json();
    return coolifyProjects;
}

