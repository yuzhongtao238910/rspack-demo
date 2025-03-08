const { rspack } = require('@rspack/core');
const { VueLoaderPlugin } = require('vue-loader');
const path = require("path")
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const envPath = path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'dev'}`);
dotenv.config({ path: envPath });


const isProduction = process.env.mode === 'production'


const hasADDPrefetch = []

let runtimeContent = ''


const AddAttributePlugin = {
    apply(compiler) {
        compiler.hooks.compilation.tap('AddAttributePlugin', compilation => {
            rspack.HtmlRspackPlugin.getCompilationHooks(
                compilation,
            ).alterAssetTags.tapPromise('AddAttributePlugin', async pluginArgs => {
                pluginArgs.assetTags.scripts = pluginArgs.assetTags.scripts.map(tag => {
                    // console.log(tag.attributes.src, 120)
                    if (tag.attributes.src && tag.attributes.src.includes('runtime')) {
                        runtimeContent = compilation.assets[tag.attributes.src] ? compilation.assets[tag.attributes.src].source() : '';
                        // console.log(runtimeContent, 120)
                        return tag;
                    }
                    if (tag.tagName === 'script') {
                        tag.attributes.prefetch = true;
                    }
                    if (tag.tagName === 'link') {
                        tag.attributes.prefetch = true;
                    }
                    hasADDPrefetch.push(tag.attributes.src)
                    return tag;
                }).filter(tag => !tag.attributes.src.includes('runtime'));
            })
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
                    const notAddedFiles = jsFiles.filter(file => !hasADDPrefetch.includes(file) && !file.includes('runtime'));
                    const scriptTags = notAddedFiles.map(file => `<script prefetch src="${file}"></script>`).join('\n');
                    // 删除含有runtime的script标签
                    // 检查是否成功删除runtime脚本标签
                    console.log('删除前的HTML:', pluginArgs.html);
                    // 删除runtime脚本标签
                    // pluginArgs.html = pluginArgs.html.replace(/<script[^>]*?runtime.*?<\/script>/, '');
                    // console.log('删除后的HTML:', pluginArgs.html);
                    // pluginArgs.html = pluginArgs.html.replace(/<script[^>]*?defer[^>]*?runtime.*?<\/script>/g, '');
                    // 删除含有runtime的script标签                    
                    // 添加其他script标签
                    // 在插入runtime内容之前，设置publicPath
                    // const publicPath = process.env.PUBLIC_PATH || '/';
                    // if (runtimeContent) {
                    //     // 在runtime内容前添加publicPath设置
                    //     runtimeContent = `window.__webpack_public_path__ = '${publicPath}';${runtimeContent}`;
                    // }

                    console.log(runtimeContent, 120)

                    // 将runtime内容添加为内联脚本到head标签中
                    if (runtimeContent) {
                        pluginArgs.html = pluginArgs.html.replace('</body>', `<script>${runtimeContent}</script></body>`);
                    //     // 找到head标签的开始位置
                        
                    //     // 找到body标签的开始位置
                    //     const bodyStartIndex = pluginArgs.html.indexOf('<body>');
                    //     if (bodyStartIndex !== -1) {
                    //         // 在body标签后插入runtime内容
                    //         // 在插入runtime内容后，从compilation中删除runtime文件
                    //         const runtimeFiles = allAssets
                    //             .filter(asset => asset.name.includes('runtime'))
                    //             .map(asset => asset.name);
                            
                    //         runtimeFiles.forEach(filename => {
                    //             // 从compilation中删除runtime文件
                    //             compilation.deleteAsset(filename);
                    //         });
                    //         pluginArgs.html = pluginArgs.html.slice(0, bodyStartIndex + 6) + 
                    //             `<script>${runtimeContent}</script>` +
                    //             pluginArgs.html.slice(bodyStartIndex + 6);
                    //     }
                    }


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
            // publicPath: '/',
            minify: false,
            templateParameters: ({htmlRspackPlugin}) => {
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