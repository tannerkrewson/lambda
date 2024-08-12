import { useState, useRef } from "react";
import { Heading, Button, Input, Textarea, Label, Spinner } from "theme-ui";

import "./App.css";
import { LambdaCenterBox, lambdaInputMap } from "./components";
import useSettings from "./useSettings";
import useNotion from "./useNotion";

function App() {
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

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
            {isLoading && <Spinner />}
            {showSettings ? (
                <Settings
                    setShowSettings={setShowSettings}
                    allSettings={allSettings}
                />
            ) : (
                <MainForm
                    setShowSettings={setShowSettings}
                    allSettings={allSettings}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    isSuccess={isSuccess}
                    setIsSuccess={setIsSuccess}
                />
            )}
        </div>
    );
}

const MainForm = ({
    setShowSettings,
    allSettings,
    isLoading,
    setIsLoading,
    isSuccess,
    setIsSuccess,
}) => {
    const { getInputList } = allSettings;

    const formRef = useRef(null);

    const notionFuncs = useNotion(allSettings);

    const inputComponents = getInputList().map(({ label, type, options }) => {
        const LambdaInputComponent = lambdaInputMap[type];
        return (
            <LambdaInputComponent key={label} label={label} options={options} />
        );
    });

    const onError = (error) => {
        setIsLoading(false);
        alert(error);
    };

    const doSubmission = (submitType, formItems = []) => {
        setIsSuccess(false);
        setIsLoading(true);
        try {
            onSubmit(
                submitType,
                formItems,
                allSettings,
                () => {
                    formRef.current.reset();
                    setIsSuccess(true);
                    setIsLoading(false);
                },
                onError,
                notionFuncs
            );
        } catch (error) {
            onError(error);
        }
    };

    return (
        <>
            {isSuccess && <div style={{ marginBottom: "1em" }}>Success</div>}

            {!isLoading && (
                <LambdaCenterBox>
                    <Button
                        variant="secondary"
                        mr={5}
                        onClick={() => doSubmission("start")}
                    >
                        Start
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => doSubmission("end")}
                    >
                        End
                    </Button>
                </LambdaCenterBox>
            )}

            <form
                className="Form"
                autoComplete="off"
                ref={formRef}
                style={{ display: isLoading ? "none" : "block" }}
                onSubmit={(event) => {
                    event.preventDefault();

                    setIsLoading(true);

                    const inputs = [...event.target.elements];

                    // remove the submit and settings buttons
                    inputs.pop();
                    inputs.pop();

                    let allInputsFilled = true;

                    const formItems = inputs.map(({ value, type, checked }) => {
                        if (type === "checkbox") return checked ? "yes" : "no";
                        // uncomment to force all inputs to be filled

                        // if (
                        //     (type === "text" ||
                        //         type === "textarea" ||
                        //         type === "select-one") &&
                        //     value === ""
                        // )
                        //     allInputsFilled = false;
                        return value;
                    });

                    if (allInputsFilled) {
                        doSubmission("submission", formItems);
                    } else {
                        onError("Please fill in all inputs.");
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
        </>
    );
};

const Settings = ({ setShowSettings, allSettings }) => {
    const {
        groupsDatabaseId,
        setGroupsDatabaseId,
        itemsDatabaseId,
        setItemsDatabaseId,
        notionApiKey,
        setNotionApiKey,
        notionApiUrl,
        setNotionApiUrl,
        OWAID,
        setOWAID,
        settings,
        setSettings,
        save,
    } = allSettings;
    return (
        <div className="Form">
            <Label>Group Database ID</Label>
            <Input value={groupsDatabaseId} onChange={setGroupsDatabaseId} />
            <Label>Items Database ID</Label>
            <Input value={itemsDatabaseId} onChange={setItemsDatabaseId} />
            <Label>Notion API Key</Label>
            <Input value={notionApiKey} onChange={setNotionApiKey} />
            <Label>Notion API Url</Label>
            <Input value={notionApiUrl} onChange={setNotionApiUrl} />
            <Label>OpenWeather App ID</Label>
            <Input value={OWAID} onChange={setOWAID} />
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

const onSubmit = (
    submitType,
    formItems,
    allSettings,
    done,
    onError,
    notionFuncs
) => {
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        appendRow(
            [
                ...getDateList(),
                ...(await getWeather(
                    coords.latitude,
                    coords.longitude,
                    allSettings.OWAID
                )),
                coords.latitude,
                coords.longitude,
                `http://maps.google.com/maps?q=${coords.latitude},${coords.longitude}`,
                ...formItems,
            ],
            allSettings,
            done,
            onError,
            submitType,
            notionFuncs
        );
    });
};

const appendRow = (
    newRow,
    allSettings,
    done,
    onError,
    submitType,
    notionFuncs
) => {
    notionFuncs[submitType]({}).then(done, (reason) => {
        try {
            onError("error: " + reason.result.error.message);
        } catch (error) {
            onError(error);
        }
    });
};

const getWeather = async (lat, lon, OWAID) => {
    try {
        const weather = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWAID}&units=imperial`
        ).then((res) => res.json());
        return [
            `${Math.round(weather.main.feels_like)}° F`,
            getDarkOrLight(weather.sys),
        ];
    } catch (error) {
        alert("didn't record temp and daylight:" + error);
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
