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
        '@storybook/addon-storysource',
        {
            name: "@storybook/addon-docs",
            options: {
                transcludeMarkdown: true,
                configureJSX: true,
                sourceLoaderOptions: {
                    language:'jsx'
                },
            },
        },
    ],
    webpackFinal: async function (config) {

        addCodeboxRemark(config);
        addScss(config)
        return config;
    }
}

function addScss(config){
    const path = require('path');
    config.module.rules.push({
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        include: path.resolve(__dirname, '../'),
    });
}
function addCodeboxRemark(config) {
    const remarkGridTables = require('remark-grid-tables')
    const codesandbox = require('remark-codesandbox');
    const {resolve} = require('path');
    const CodesandboxTemplatePackageJSON = require('./codesandbox-template/package.json');

    const mdxRule = config.module.rules.find((rule) => {
        return rule.test.test && rule.test.test('.story.mdx');
    });

    const {options: {remarkPlugins}} = mdxRule.use.find(
        ({loader}) => loader === require.resolve('@mdx-js/loader')
    );

    const isProduction = process.env.NODE_ENV === 'production';

    remarkPlugins.push(remarkGridTables)

    remarkPlugins.push([
        codesandbox,
        {
            mode: isProduction?'button':'iframe', //button iframe
            query: {
                // fontsize: 14,
                hidenavigation: 1, //Hide the DevTools bar of the preview.
                view: isProduction?'editor':'split', //editor/split/preview
                codemirror:1,
                highlights:'', //Which lines to highlight (only works in CodeMirror)
                // previewwindow:'' //console/tests/browser
                // initialpath:'/' // Which url to initially load in address bar
                // moduleview :'' // Evaluate the file that is open in the editor.
                module:'src/index.html'

            },
            autoDeploy:  isProduction,
            customTemplates: {
                animeManager: {
                    extends: `file:${resolve(__dirname, './codesandbox-template')}`,
                    entry: 'src/App.js',
                    query:{
                        overrideEntry:"2-",
                    },
                     //Which module to open by default. Multiple paths comma separated are allowed, in that case we show them as tabs
                }
            },
        }
    ]);


    // config.module.rules.push({
    //     test: /\.(stories|story)\.mdx$/,
    //     use: [
    //         {
    //             loader: '@mdx-js/loader',
    //             options: {
    //                 compilers: [createCompiler({})],
    //                 remarkPlugins: [[codesandbox, { mode: 'button' }]],
    //             },
    //         },
    //     ],
    // });
}
