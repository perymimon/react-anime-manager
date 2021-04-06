module.exports = {
    reactOptions: {
        fastRefresh: true,
    },
    "stories": [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    "addons": [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "storybook-addon-jsx",
        '@storybook/addon-storysource'
    ]
}