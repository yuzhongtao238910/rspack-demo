const { rspack } = require('@rspack/core');
const { VueLoaderPlugin } = require('vue-loader');
const path = require("path")
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const envPath = path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'dev'}`);
dotenv.config({ path: envPath });


const isProduction = process.env.mode === 'production'


const hasADDPrefetch = []


const AddAttributePlugin = {
    apply(compiler) {
        compiler.hooks.compilation.tap('AddAttributePlugin', compilation => {
            rspack.HtmlRspackPlugin.getCompilationHooks(
                compilation,
            ).alterAssetTags.tapPromise('AddAttributePlugin', async pluginArgs => {
                pluginArgs.assetTags.scripts = pluginArgs.assetTags.scripts.map(tag => {
                    if (tag.tagName === 'script') {
                        tag.attributes.prefetch = true;
                    }
                    if (tag.tagName === 'link') {
                        tag.attributes.prefetch = true;
                    }
                    hasADDPrefetch.push(tag.attributes.src)
                    return tag;
                });
            });
        });
    },
};

const InjectContentPlugin = {
    apply(compiler) {
        compiler.hooks.compilation.tap('InjectContentPlugin', compilation => {
            rspack.HtmlRspackPlugin.getCompilationHooks(
                compilation,
            ).afterTemplateExecution.tapPromise(
              'InjectContentPlugin',
                async pluginArgs => {
                    const allAssets = compilation.getAssets();
                    const jsFiles = allAssets
                        .filter(asset => asset.name.endsWith('.js'))
                        .map(asset => asset.name);
                    const notAddedFiles = jsFiles.filter(file => !hasADDPrefetch.includes(file));
                    const scriptTags = notAddedFiles.map(file => `<script prefetch src="${file}"></script>`).join('\n');
                    pluginArgs.html = pluginArgs.html.replace(
                        '</body>',
                        `${scriptTags}\n</body>`
                    );
                },
            );
        });
    },
};


/** @type {import('@rspack/cli').Configuration} */
const config = {
    context: __dirname,
    entry: {
        main: './src/main.js',
    },
    mode: isProduction ? 'production' : 'development',
    output: {
        clean: true,
        filename: '[name].[chunkhash].js',
        chunkFilename: 'chunk.[name].[chunkhash].js',
    },
    experiments: {
        css: false,
    },
    devServer: {
        historyApiFallback: true,
        port: 8080,
        proxy: [
            {
                context: ['/api'],
                target: 'http://localhost:3000',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': '',
                },
            },
        ],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, './src'),
        }
    },
    devtool: 'cheap-source-map',
    plugins: [
        new VueLoaderPlugin(),
        new rspack.HtmlRspackPlugin({
            template: './index.html',
            templateParameters: ({htmlRspackPlugin}) => {
                return {
                    sdkHost: "https://test-admin.edianzu.cn"
                }
            }
        }),
        new rspack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
        }),
        new rspack.CssExtractRspackPlugin({}),
        AddAttributePlugin,
        InjectContentPlugin
    ],
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: [
                    {
                        loader: 'vue-loader',
                        options: {
                            experimentalInlineMatchResource: true,
                        },
                    },
                ],  
            },  
            { 
                test: /\.less$/,
                use: [isProduction ? rspack.CssExtractRspackPlugin.loader : 'style-loader', 'css-loader', 'less-loader'],
                type: 'javascript/auto',
            },  
            {
                test: /\.css$/i,
                use: [isProduction ? rspack.CssExtractRspackPlugin.loader : 'style-loader', 'css-loader'],
                type: 'javascript/auto',
            },
            {
                test: /\.svg$/,
                type: 'asset/resource',
            },
            {
                test: /\.(sass|scss)$/,
                use: [
                    isProduction ? rspack.CssExtractRspackPlugin.loader : 'style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            // 同时使用 `modern-compiler` 和 `sass-embedded` 可以显著提升构建性能
                            // 需要 `sass-loader >= 14.2.1`
                            api: 'modern-compiler',
                            implementation: require.resolve('sass-embedded'),
                        },
                    },
                ],
                type: 'javascript/auto',
            },
        ],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            minChunks: 1,
            minSize: 10000,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            cacheGroups: {
                vue: {
                    name: 'vue',
                    test: /[\\/]node_modules[\\/]vue[\\/]/,
                    priority: 10,
                    chunks: 'all',
                    reuseExistingChunk: true
                },
                axios: {
                    name: 'axios', 
                    test: /[\\/]node_modules[\\/]axios[\\/]/,
                    priority: 9,
                    chunks: 'all',
                    reuseExistingChunk: true
                },
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    },
};
module.exports = config;