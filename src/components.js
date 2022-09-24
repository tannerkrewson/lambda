import { Input, Select, Textarea, Switch, Label, Flex, Box } from "theme-ui";

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
    <Flex
        sx={{
            justifyContent: "space-between",
            alignItems: "center",
            py: 4,
            paddingTop: 0,
            paddingBottom: 0,
        }}
    >
        <Label>{label}</Label>
        <Box>
            <Switch />
        </Box>
    </Flex>
);

const LambdaSelect = ({ label, options }) => (
    <>
        <Label>{label}</Label>
        <Select name="select">
            <option defaultValue></option>
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
