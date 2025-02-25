const { rspack } = require('@rspack/core');
const { VueLoaderPlugin } = require('vue-loader');
const path = require("path")
const dotenv = require('dotenv');


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
        filename: 'main.[chunkhash].js',
        chunkFilename: 'chunk.[chunkhash].js',
    },
    experiments: {
        css: false,
    },
    devServer: {
        historyApiFallback: true,
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
              // 获取所有生成的文件
              const files = htmlRspackPlugin.files;
              const prefetchTags = files.js.concat(files.css)
                .map(file => {
                  return `<link rel="prefetch" href="${file}" />`;
                })
                .join('\n');
              return {
                  sdkHost: "https://test-admin.edianzu.cn",
                  prefetchTags
              }
            }
        }),
        new rspack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
        }),
        new rspack.CssExtractRspackPlugin({}),
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
};
module.exports = config;