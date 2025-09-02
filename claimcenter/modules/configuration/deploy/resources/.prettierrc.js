module.exports = {
    tabWidth: 2,
    printWidth: 140,
    overrides: [
        {
            files: "*.json5",
            options: {
                parser: "json",
            },
        },
        {
            files: "*.json",
            options: {
                tabWidth: 2,
            },
        },
        {
            files: "*.scss",
            options: {
                tabWidth: 2,
            },
        },
        {
            files: "*.mdx",
            options: {
                proseWrap: "always",
            },
        },
    ],
};
