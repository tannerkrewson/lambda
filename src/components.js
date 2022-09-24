import { Input, Select, Textarea, Switch, Label } from "theme-ui";

const LambdaCenterBox = ({ children }) => (
    <div
        style={{
            display: "flex",
            justifyContent: "center",
        }}
    >
        {children}
    </div>
);

const LambdaInput = ({ label }) => (
    <>
        <Label>{label}</Label>
        <Input />
    </>
);

const LambdaSwitch = ({ label }) => (
    <div
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}
    >
        <div>
            <Switch label={label} />
        </div>
    </div>
);

const LambdaSelect = ({ label, options }) => (
    <>
        <Label>{label}</Label>
        <Select name="select">
            <option disabled selected></option>
            {options.map((option) => (
                <option key={option}>{option}</option>
            ))}
        </Select>
    </>
);

const LambdaTextArea = ({ label }) => (
    <>
        <Label>{label}</Label>
        <Textarea
            autoComplete="off"
            name="textarea"
            onKeyPress={(e) => {
                e.key === "Enter" && e.preventDefault();
            }}
        />
    </>
);

const lambdaInputMap = {
    input: LambdaInput,
    switch: LambdaSwitch,
    select: LambdaSelect,
    textarea: LambdaTextArea,
};

export { lambdaInputMap, LambdaCenterBox };
