import { getPreferenceValues } from "@raycast/api";
import { LocalStorage } from "@raycast/api";
import CoolifyServer from "./../types/coolifyServer";

export default async function getAllCoolifyServers(): Promise<CoolifyServer[]> {
    const { coolifyToken, coolifyUrl } = getPreferenceValues<Preferences>();
    const response = await fetch(`${coolifyUrl}/api/v1/servers`, {
        headers: {
            "Authorization": `Bearer ${coolifyToken}`
        }
    });
    const coolifyServers = await response.json();
    return coolifyServers;
}

