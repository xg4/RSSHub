const got = require('@/utils/got');

module.exports = async (ctx) => {
    const [v2rayRes, ssrRes] = await Promise.all([
        got({
            method: 'get',
            url: 'https://api.free-ssr.xyz/v2ray',
        }),
        got({
            method: 'get',
            url: 'https://api.free-ssr.xyz/ssr',
        }),
    ]);

    const list = [...v2rayRes.data, ...ssrRes.data];
    const items = list.map((item) => {
        const type = item.url.split('://')[0];
        const url = item.url;
        item.url = url.slice(0, 15) + url.slice(16);
        return {
            title: item.name + ' - ' + type,
            category: type,
            description: `<a style="word-break:break-all;" href="${item.url}">${item.url}</a>`,
            pubDate: new Date(item.update_time).toUTCString(),
            guid: item.id + item.update_time,
        };
    });

    ctx.state.data = {
        title: 'free-ssr',
        link: 'https://free-ssr.xyz',
        item: items,
    };
};
