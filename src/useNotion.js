import { useState } from "react";
import { Client } from "@notionhq/client";

const getDerivativeProps = (dynamicProperties, derivatives) => {
    let res = {};
    Object.keys(derivatives).forEach((dProp) => {
        const thisProp = dynamicProperties[dProp];

        if (!thisProp) return;
        Object.keys(derivatives[dProp]).forEach((dPropVal) => {
            const thisPropVal = thisProp?.select?.name;

            if (!thisPropVal) return;
            if (thisPropVal === dPropVal) {
                res = { ...res, ...derivatives[dProp][dPropVal] };
            }
        });
    });

    return res;
};

const useNotion = ({
    groupsDatabaseId,
    itemsDatabaseId,
    notionApiKey,
    notionApiUrl,
    derivatives,
}) => {
    const notion = new Client({ auth: notionApiKey, baseUrl: notionApiUrl });
    const [groupId, setGroupId] = useState(null);

    // 1. Start function
    const start = async (onSuccess, onError) => {
        try {
            const response = await notion.pages.create({
                parent: { database_id: groupsDatabaseId },
                properties: {
                    Start: {
                        date: {
                            start: new Date().toISOString(),
                        },
                    },
                },
            });

            setGroupId(response.id);
            onSuccess();
        } catch (error) {
            onError(error.message);
        }
    };

    // 2. Submission function
    const submission = async (dynamicProperties, onSuccess, onError) => {
        try {
            const properties = {
                ...dynamicProperties,
                ...getDerivativeProps(dynamicProperties, derivatives),
                ...(groupId && {
                    Push: {
                        relation: [{ id: groupId }],
                    },
                }),
            };

            properties.Name = {
                id: "title",
                type: "title",
                title: [
                    {
                        type: "text",
                        text: {
                            content:
                                properties?.Name?.text?.name ||
                                properties?.Rating?.select?.name ||
                                "",
                        },
                    },
                ],
            };

            const notes = properties.Notes;
            delete properties.Notes;

            const response = await notion.pages.create({
                parent: { database_id: itemsDatabaseId },
                properties,
            });

            if (notes) {
                await notion.comments.create({
                    parent: {
                        page_id: response.id,
                    },
                    rich_text: [
                        {
                            text: {
                                content: notes.text.name,
                            },
                        },
                    ],
                });
            }

            onSuccess();
        } catch (error) {
            onError(error.message);
        }
    };

    // 3. End function
    const end = async (onSuccess, onError) => {
        if (!groupId) {
            alert("No group started.");
            return;
        }

        try {
            const response = await notion.pages.update({
                page_id: groupId,
                properties: {
                    End: {
                        date: {
                            start: new Date().toISOString(),
                        },
                    },
                },
            });

            setGroupId(null); // Reset the group ID
            onSuccess();
        } catch (error) {
            onError(error.message);
        }
    };

    return {
        start,
        submission,
        end,
    };
};

export default useNotion;
