import { useState, useRef } from "react";
import { Heading, Button, Textarea, Label, Spinner } from "theme-ui";

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
    const { settings } = allSettings || {};

    const formRef = useRef(null);

    const onError = (error) => {
        setIsLoading(false);
        alert(error);
    };

    const notionFuncs = useNotion(settings, onError);

    const inputComponents = settings?.inputs?.map(
        ({ label, type, options }) => {
            const LambdaInputComponent = lambdaInputMap[type];
            return (
                <LambdaInputComponent
                    key={label}
                    label={label}
                    options={options}
                />
            );
        }
    );

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

                    const formItems = inputs.reduce(
                        (prev, { value, type, checked }, i) => {
                            const { label } = settings?.inputs[i];

                            const typeMap = {
                                "select-one": "select",
                                checkbox: "checkbox",
                                text: "text",
                            };
                            const typeVal =
                                type === "checkbox"
                                    ? checked
                                    : {
                                          name: value,
                                      };

                            return {
                                ...prev,
                                [label]: {
                                    type: typeMap[type],
                                    [typeMap[type]]: typeVal,
                                },
                            };
                        },
                        {}
                    );

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
    const { settingsString, setSettings } = allSettings;
    return (
        <div className="Form">
            <Label>Settings JSON</Label>
            <Textarea
                value={settingsString}
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

const onSubmit = (submitType, formItems, allSettings, done, notionFuncs) => {
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        notionFuncs[submitType]({
            ...(await getWeather(
                coords.latitude,
                coords.longitude,
                allSettings.settings.OWAID
            )),
            weekday: new Date().toLocaleString("default", {
                weekday: "long",
            }),
            maps: `http://maps.google.com/maps?q=${coords.latitude},${coords.longitude}`,
            ...formItems,
        }).then(done);
    });
};

const getWeather = async (lat, lon, OWAID) => {
    try {
        const weather = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWAID}&units=imperial`
        ).then((res) => res.json());
        return {
            temperature: `${Math.round(weather.main.feels_like)}° F`,
            sun: getDarkOrLight(weather.sys),
        };
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

export default App;
