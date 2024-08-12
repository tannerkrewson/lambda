import { useState } from "react";
import { Client } from "@notionhq/client";

const useNotion = ({
    groupsDatabaseId,
    itemsDatabaseId,
    notionApiKey,
    notionApiUrl,
}) => {
    const notion = new Client({ auth: notionApiKey, baseUrl: notionApiUrl });
    const [groupId, setGroupId] = useState(null);

    // 1. Start function
    const start = async () => {
        try {
            const response = await notion.pages.create({
                parent: { database_id: groupsDatabaseId },
                properties: {
                    "Start Date": {
                        date: {
                            start: new Date().toISOString(),
                        },
                    },
                    Name: {
                        title: [
                            {
                                text: {
                                    content: "New Group",
                                },
                            },
                        ],
                    },
                },
            });

            setGroupId(response.id);
            console.log("Group created:", response);
        } catch (error) {
            console.error("Error creating group:", error);
        }
    };

    // 2. Submission function
    const submission = async (dynamicProperties) => {
        try {
            const properties = {
                ...dynamicProperties,
                ...(groupId && {
                    Group: {
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
            console.error("Error creating item:", error);
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
                    "End Date": {
                        date: {
                            start: new Date().toISOString(),
                        },
                    },
                },
            });

            console.log("Group ended:", response);
            setGroupId(null); // Reset the group ID
        } catch (error) {
            console.error("Error ending group:", error);
        }
    };

    return {
        start,
        submission,
        end,
    };
};

export default useNotion;
