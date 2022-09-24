import { useEffect, useState } from "react";
import { Heading, Button, Input, Textarea, Label } from "theme-ui";
import useLocalStorage from "use-local-storage";

import "./App.css";
import { LambdaCenterBox, lambdaInputMap } from "./components";

const useSettings = () => {
    const [SID, setSID] = useLocalStorage("SID", "");
    const [savedSettings, saveSettings] = useLocalStorage("settings", "[]");

    const [settings, setSettings] = useState(savedSettings);

    return {
        SID,
        setSID,
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

function App() {
    const [showSettings, setShowSettings] = useState(false);
    const allSettings = useSettings();

    return (
        <div className="App">
            <Heading
                sx={{
                    fontFamily: "sans-serif",
                    transform: "scale(1.1, 1)",
                    marginTop: "1rem",
                    fontSize: "4em",
                }}
            >
                λ
            </Heading>
            {showSettings ? (
                <Settings
                    setShowSettings={setShowSettings}
                    allSettings={allSettings}
                />
            ) : (
                <MainForm
                    setShowSettings={setShowSettings}
                    allSettings={allSettings}
                />
            )}
        </div>
    );
}

const MainForm = ({ setShowSettings, allSettings }) => {
    const { getInputList } = allSettings;

    const inputComponents = getInputList().map(({ label, type, options }) => {
        const LambdaInputComponent = lambdaInputMap[type];
        return (
            <LambdaInputComponent key={label} label={label} options={options} />
        );
    });

    return (
        <form
            className="Form"
            autoComplete="off"
            onSubmit={(event) => {
                event.preventDefault();

                //setIsLoading(true);

                const inputs = [...event.target.elements];

                // remove the submit and settings buttons
                inputs.pop();
                inputs.pop();

                let allInputsFilled = true;
                const formItems = inputs.map(({ value, type, checked }) => {
                    if (type === "checkbox") return checked ? "yes" : "no";
                    if (
                        (type === "text" ||
                            type === "textarea" ||
                            type === "select-one") &&
                        value === ""
                    )
                        allInputsFilled = false;
                    return value;
                });

                if (allInputsFilled) {
                    onSubmit(formItems, () => {
                        //window.location.reload();
                    });
                } else {
                    //setIsLoading(false);
                    alert("Please fill in all inputs.");
                }
            }}
        >
            {inputComponents}

            <LambdaCenterBox>
                <Button
                    variant="secondary"
                    mr={5}
                    onClick={(e) => {
                        e.preventDefault();
                        setShowSettings(true);
                    }}
                >
                    🛠
                </Button>
                <Button variant="primary">Submit</Button>
            </LambdaCenterBox>
        </form>
    );
};

const Settings = ({ setShowSettings, allSettings }) => {
    const { SID, setSID, settings, setSettings, save } = allSettings;
    return (
        <div className="Form">
            <Label>Spreadsheet</Label>
            <Input value={SID} onChange={setSID} />
            <Label>Input List</Label>
            <Textarea
                value={settings}
                onChange={setSettings}
                autoComplete="off"
                name="textarea"
                onKeyPress={(e) => {
                    e.key === "Enter" && e.preventDefault();
                }}
            />
            <LambdaCenterBox>
                <Button
                    variant="primary"
                    onClick={() => {
                        try {
                            save();
                            setShowSettings(false);
                        } catch (error) {
                            alert(error);
                        }
                    }}
                >
                    Save
                </Button>
            </LambdaCenterBox>
        </div>
    );
};

const onSubmit = (formItems, done) => {
    console.log(formItems);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        appendRow(
            [
                ...getDateList(),
                ...(await getWeather(coords.latitude, coords.longitude)),
                coords.latitude,
                coords.longitude,
                `http://maps.google.com/maps?q=${coords.latitude},${coords.longitude}`,
                ...formItems,
            ],
            done
        );
    });
};

function appendRow(newRow, done) {
    done();
    // const spreadsheetId = "?";
    // window.gapi.client.sheets.spreadsheets.values
    //     .append({
    //         spreadsheetId,
    //         range: "Raw",
    //         valueInputOption: "USER_ENTERED",
    //         resource: {
    //             majorDimension: "ROWS",
    //             values: [newRow],
    //         },
    //     })
    //     .then((e) => {
    //         if (e.status !== 200) {
    //             alert(e.statusText);
    //         }
    //         done();
    //     });
}

const getWeather = async (lat, lon) => {
    const openWeatherAppId = "";

    try {
        const weather = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherAppId}&units=imperial`
        ).then((res) => res.json());
        return [
            `${Math.round(weather.main.feels_like)}° F`,
            getDarkOrLight(weather.sys),
        ];
    } catch (error) {
        return ["?", "?"];
    }
};

const getDarkOrLight = ({ sunrise, sunset }) => {
    const curTime = Math.round(new Date().getTime() / 1000);
    const isAfterSunrise = curTime >= sunrise;
    const isBeforeSunset = curTime <= sunset;

    return isAfterSunrise && isBeforeSunset ? "Light" : "Dark";
};

const getDateList = () => {
    const now = new Date();

    const monthDay = now.toLocaleString("default", {
        month: "long",
        day: "numeric",
    });
    const year = now.toLocaleString("default", { year: "numeric" });
    const weekday = now.toLocaleString("default", { weekday: "long" });
    const time = now.toLocaleTimeString("en-us", { hour12: true });

    return [monthDay + " " + year, weekday, time];
};

export default App;
