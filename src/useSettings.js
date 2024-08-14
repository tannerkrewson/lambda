import { useMemo, useState } from "react";
import useLocalStorage from "use-local-storage";

const useSettings = () => {
    const [savedSettings, saveSettings] = useLocalStorage("settings", "{}");

    const [settingsString, setSettings] = useState(savedSettings);

    const settings = useMemo(() => {
        try {
            saveSettings(settingsString);
            return JSON.parse(settingsString);
        } catch (error) {}
    }, [saveSettings, settingsString]);

    return {
        settings,
        settingsString,
        setSettings: (e) => setSettings(e.target.value),
    };
};

export default useSettings;
