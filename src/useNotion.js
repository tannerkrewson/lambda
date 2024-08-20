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

const getNextPageTitle = async (notion, databaseId, groupName) => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            sorts: [
                {
                    property: "Start",
                    direction: "descending",
                },
            ],
            page_size: 1,
        });

        if (response.results.length === 0) return `${groupName} 1`;

        const lastName =
            response.results[0].properties.Name.title[0].plain_text;
        return `${groupName} ${parseInt(lastName.split(" ")[1]) + 1}`;
    } catch (error) {
        return `${groupName} ?`;
    }
};

const useNotion = ({
    groupsDatabaseId,
    itemsDatabaseId,
    groupName,
    notionApiKey,
    notionApiUrl,
    derivatives,
}) => {
    const notion = new Client({ auth: notionApiKey, baseUrl: notionApiUrl });
    const [groupId, setGroupId] = useState(null);
    const [groupItems, setGroupItems] = useState(null);

    // 1. Start function
    const start = async (dynamicProperties, onSuccess, onError) => {
        try {
            const title = await getNextPageTitle(
                notion,
                groupsDatabaseId,
                groupName
            );
            const properties = {
                ...dynamicProperties,
                Start: {
                    date: {
                        start: new Date().toISOString(),
                    },
                },
                Name: {
                    id: "title",
                    type: "title",
                    title: [
                        {
                            type: "text",
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
            };

            const response = await notion.pages.create({
                parent: { database_id: groupsDatabaseId },
                properties,
            });

            setGroupId(response.id);
            setGroupItems(dynamicProperties);
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
                                properties?.Name[0]?.text?.content ||
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
    const end = async (dynamicProperties, onSuccess, onError) => {
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
            setGroupItems(null);
            onSuccess();
        } catch (error) {
            onError(error.message);
        }
    };

    return {
        groupStarted: !!groupId,
        groupItems,
        notionFuncs: {
            start,
            submission,
            end,
        },
    };
};

export default useNotion;
