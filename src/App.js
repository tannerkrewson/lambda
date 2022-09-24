import { useState } from "react";
import { Heading, Button, Input, Select, Textarea, Switch } from "theme-ui";
import "./App.css";

function App() {
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
            <MainForm />
        </div>
    );
}

const MainForm = () => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <form
            className="Form"
            autoComplete="off"
            onSubmit={(event) => {
                event.preventDefault();

                setIsLoading(true);

                const inputs = [...event.target.elements];

                // remove the submit button
                inputs.pop();

                console.log(inputs);

                let allInputsFilled = true;
                inputs.map(({ value, type, checked }) => {
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
                    onSubmit(inputs, () => {
                        //window.location.reload();
                    });
                } else {
                    setIsLoading(false);
                    alert("Please fill in all inputs.");
                }
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    rowGap: "10px",
                }}
            >
                <div>
                    <Switch name="switch" label="Switch" />
                </div>
            </div>
            <Select name="select">
                <option disabled selected></option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
            </Select>
            <Input name="input" />
            <Textarea
                autocomplete="off"
                name="textarea"
                onKeyPress={(e) => {
                    e.key === "Enter" && e.preventDefault();
                }}
            />

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Button variant="primary">Submit</Button>
            </div>
        </form>
    );
};

const onSubmit = (formItems, done) => {
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
