const { rspack } = require('@rspack/core');
const hasADDPrefetch = []

let runtimeContent = ''


const AddAttributePlugin = {
    apply(compiler) {
        compiler.hooks.compilation.tap('AddAttributePlugin', compilation => {
            rspack.HtmlRspackPlugin.getCompilationHooks(
                compilation,
            ).alterAssetTags.tapPromise('AddAttributePlugin', async pluginArgs => {
                pluginArgs.assetTags.scripts = pluginArgs.assetTags.scripts.map(tag => {
                    if (tag.attributes.src && tag.attributes.src.includes('runtime')) {
                        runtimeContent = compilation.assets[tag.attributes.src] ? compilation.assets[tag.attributes.src].source() : '';
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
                    if (runtimeContent) {
                        pluginArgs.html = pluginArgs.html.replace('</body>', `<script>${runtimeContent}</script></body>`);
                        const runtimeFiles = allAssets
                        .filter(asset => asset.name.includes('runtime'))
                        .map(asset => asset.name);
                        runtimeFiles.forEach(filename => {
                           compilation.deleteAsset(filename);
                        });
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


module.exports = {
    AddAttributePlugin,
    InjectContentPlugin
}