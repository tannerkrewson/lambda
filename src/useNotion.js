import { useState } from "react";
import { Client } from "@notionhq/client";

const useNotion = (
    { groupsDatabaseId, itemsDatabaseId, notionApiKey, notionApiUrl },
    onError
) => {
    const notion = new Client({ auth: notionApiKey, baseUrl: notionApiUrl });
    const [groupId, setGroupId] = useState(null);

    // 1. Start function
    const start = async () => {
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
        } catch (error) {
            onError(error.message);
        }
    };

    // 2. Submission function
    const submission = async (dynamicProperties) => {
        console.log(dynamicProperties);

        try {
            const properties = {
                ...dynamicProperties,
                ...(groupId && {
                    Push: {
                        relation: [{ id: groupId }],
                    },
                }),
            };

            const response = await notion.pages.create({
                parent: { database_id: itemsDatabaseId },
                properties,
            });

            console.log("Item created:", response);
        } catch (error) {
            onError(error.message);
        }
    };

    // 3. End function
    const end = async () => {
        if (!groupId) {
            console.error("No group started.");
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
