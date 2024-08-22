import { useState, useRef, useMemo } from "react";
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

const InputForm = ({
    settingsInputs = [],
    isLoading,
    setIsLoading,
    onSubmit,
    onSuccess,
    onError,
    submitLabel = "Submit",
}) => {
    const formRef = useRef(null);
    const inputComponents = useMemo(
        () =>
            settingsInputs.map(({ label, type, options }) => {
                const LambdaInputComponent = lambdaInputMap[type];
                return (
                    <LambdaInputComponent
                        key={label}
                        label={label}
                        options={options}
                    />
                );
            }),
        [settingsInputs]
    );
    return (
        <form
            className="Form"
            autoComplete="off"
            ref={formRef}
            style={{ display: isLoading ? "none" : "block" }}
            onSubmit={(event) => {
                event.preventDefault();

                setIsLoading(true);

                const inputs = [...event.target.elements];

                // remove the submit button
                inputs.pop();

                const formItems = inputs.reduce(
                    (prev, { value, type, checked }, i) => {
                        // if an input is empty, don't include it
                        if (!value) return prev;

                        const { label } = settingsInputs[i];

                        if (type === "text" || type === "textarea") {
                            return {
                                ...prev,
                                [label]: {
                                    rich_text: [
                                        {
                                            text: {
                                                content: value,
                                            },
                                        },
                                    ],
                                },
                            };
                        }

                        const typeMap = {
                            "select-one": "select",
                            checkbox: "checkbox",
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
                                [typeMap[type]]: typeVal,
                            },
                        };
                    },
                    {}
                );

                onSubmit(
                    formItems,
                    () => {
                        formRef.current.reset();
                        onSuccess();
                    },
                    onError
                );
            }}
        >
            {inputComponents}

            <LambdaCenterBox>
                <Button variant="primary">{submitLabel}</Button>
            </LambdaCenterBox>
        </form>
    );
};

const GroupItems = ({ data }) => {
    if (!data) return;
    const renderContent = (value) => {
        if (value.rich_text) {
            return value.rich_text.map((item, index) => (
                <span key={index}>{item.text.content}</span>
            ));
        } else if (value.select) {
            return <span>{value.select.name}</span>;
        }
        return null;
    };

    return (
        <div style={{ marginBottom: ".5em" }}>
            {Object.entries(data).map(([key, value], index) => (
                <div key={index} style={{ marginBottom: ".5em" }}>
                    <span style={{ fontWeight: "bold" }}>{key}</span>:{" "}
                    {renderContent(value)}
                </div>
            ))}
        </div>
    );
};

const MainForm = ({
    setShowSettings,
    allSettings,
    isLoading,
    setIsLoading,
    isSuccess,
    setIsSuccess,
}) => {
    const { settings } = allSettings || {};

    const onSuccess = () => {
        setIsSuccess(true);
        setIsLoading(false);
    };

    const onError = (error) => {
        setIsLoading(false);
        alert(error);
        console.error(error);
    };

    const { notionFuncs, groupStarted, groupItems } = useNotion(settings);

    const doSubmission = (submitType, formItems = [], s, e) => {
        setIsSuccess(false);
        setIsLoading(true);
        try {
            submitMainForm(
                submitType,
                formItems,
                allSettings,
                notionFuncs,
                s,
                e
            );
        } catch (error) {
            onError(error);
        }
    };

    const submitStart = (formItems = []) => {
        setIsSuccess(false);
        setIsLoading(true);
        try {
            submitMainForm(
                "start",
                formItems,
                allSettings,
                notionFuncs,
                onSuccess,
                onError
            );
        } catch (error) {
            onError(error);
        }
    };

    return (
        <>
            {isSuccess && <div style={{ marginBottom: "1em" }}>Success</div>}

            {!isLoading &&
                (groupStarted ? (
                    <>
                        <GroupItems data={groupItems} />
                        <LambdaCenterBox>
                            <Button
                                onClick={() =>
                                    doSubmission(
                                        "end",
                                        null,
                                        onSuccess,
                                        onError
                                    )
                                }
                            >
                                End
                            </Button>
                        </LambdaCenterBox>
                    </>
                ) : (
                    <InputForm
                        settingsInputs={settings?.groupInputs}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        onSubmit={submitStart}
                        onSuccess={onSuccess}
                        onError={onError}
                        submitLabel="Start"
                    />
                ))}

            <InputForm
                settingsInputs={settings?.inputs}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSubmit={(f, s, e) => doSubmission("submission", f, s, e)}
                onSuccess={onSuccess}
                onError={onError}
            />
            {!isLoading && (
                <LambdaCenterBox>
                    <Button
                        variant="secondary"
                        mt={4}
                        mb={3}
                        onClick={(e) => {
                            e.preventDefault();
                            setShowSettings(true);
                        }}
                    >
                        🛠
                    </Button>
                </LambdaCenterBox>
            )}
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
                    onClick={() => setShowSettings(false)}
                >
                    Save
                </Button>
            </LambdaCenterBox>
        </div>
    );
};

const submitMainForm = (
    submitType,
    formItems,
    allSettings,
    notionFuncs,
    s,
    e
) => {
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        notionFuncs[submitType](
            {
                // ...(await getWeather(
                //     coords.latitude,
                //     coords.longitude,
                //     allSettings.settings.OWAID
                // )),
                // weekday: new Date().toLocaleString("default", {
                //     weekday: "long",
                // }),
                // maps: `http://maps.google.com/maps?q=${coords.latitude},${coords.longitude}`,
                ...formItems,
            },
            s,
            e
        );
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
