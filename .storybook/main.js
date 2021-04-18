module.exports = {
    reactOptions: {
        fastRefresh: true,
    },
    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    addons: [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "storybook-addon-jsx",
        '@storybook/addon-storysource'
    ],
    webpackFinal:async function(config){
        const path = require('path');
        config.module.rules.push({
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
            include: path.resolve(__dirname, '../'),
        });
        return config;
    }
}