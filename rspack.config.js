const { rspack } = require('@rspack/core');
const { VueLoaderPlugin } = require('vue-loader');
const path = require("path")
const dotenv = require('dotenv');
const { AddAttributePlugin, InjectContentPlugin } = require("./plugins/add-attribute-plugin.js")


const envPath = path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'dev'}`);
dotenv.config({ path: envPath });


const isProduction = process.env.mode === 'production'




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
        // publicPath: '/',
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
            minify: false,
            templateParameters: ({ htmlRspackPlugin }) => {
                return {
                    // 注入变量哈
                    sdkHost: "https://test-admin.edianzu.cn",
                    host: "http://localhost:8080"
                }
            }
        }),
        new rspack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
        }),
        new rspack.CssExtractRspackPlugin({}),
        isProduction ? AddAttributePlugin : null,
        isProduction ? InjectContentPlugin : null,
        new rspack.optimize.RuntimeChunkPlugin({
            name: ({ name }) => {
                console.log(name, 120)
                return `runtime~${name}`
            },
        }),
    ].filter(Boolean),
    module: {
        rules: [
            {
                oneOf: [
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
                ]
            },
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
                test: /\.svg$/,
                type: 'asset/resource',
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'builtin:swc-loader',
                    options: {
                        jsc: {
                            target: 'es2015',
                        }
                    },
                },
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