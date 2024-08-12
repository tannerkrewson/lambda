import { useState } from "react";
import useLocalStorage from "use-local-storage";

const useSettings = () => {
    const [groupsDatabaseId, setGroupsDatabaseId] = useLocalStorage(
        "groupsDatabaseId",
        ""
    );
    const [itemsDatabaseId, setItemsDatabaseId] = useLocalStorage(
        "itemsDatabaseId",
        ""
    );
    const [notionApiKey, setNotionApiKey] = useLocalStorage("notionApiKey", "");
    const [notionApiUrl, setNotionApiUrl] = useLocalStorage("notionApiUrl", "");
    const [OWAID, setOWAID] = useLocalStorage("OWAID", "");
    const [savedSettings, saveSettings] = useLocalStorage("settings", "[]");

    const [settings, setSettings] = useState(savedSettings);

    return {
        groupsDatabaseId,
        setGroupsDatabaseId: (e) => setGroupsDatabaseId(e.target.value),
        itemsDatabaseId,
        setItemsDatabaseId: (e) => setItemsDatabaseId(e.target.value),
        notionApiKey,
        setNotionApiKey: (e) => setNotionApiKey(e.target.value),
        notionApiUrl,
        setNotionApiUrl: (e) => setNotionApiUrl(e.target.value),
        OWAID,
        setOWAID: (e) => setOWAID(e.target.value),
        settings,
        setSettings: (e) => setSettings(e.target.value),
        save: () => {
            if (!settings.startsWith("["))
                // eslint-disable-next-line no-throw-literal
                throw "Settings must be an array";

            saveSettings(settings);
        },
        getInputList: () => {
            return Array.isArray(settings) ? settings : JSON.parse(settings);
        },
    };
};

export default useSettings;
