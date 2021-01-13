const got = require('@/utils/got');
const cheerio = require('cheerio');

async function fetchRule(ctx, uuid) {
    const url = 'https://zw.cdzj.chengdu.gov.cn/lottery/accept/getProjectRule';
    const cache = ctx.cache.get(url + uuid);
    if (cache) {
        return cache;
    }
    const response = await got({
        method: 'post',
        url,
        responseType: 'json',
        form: {
            projectUuid: uuid,
        },
    });

    if (response.data.success) {
        const rule = response.data.message;
        ctx.cache.set(url + uuid, rule);
        return rule;
    }
    return '';
}

module.exports = async (ctx) => {
    const response = await got({
        method: 'get',
        url: 'https://zw.cdzj.chengdu.gov.cn/lottery/accept/projectList',
    });
    const $ = cheerio.load(response.data);
    const sourceData = $('#_projectInfo tr')
        .map((_, item) => {
            const tds = $(item).children();
            return {
                uuid: $(tds[0]).text(),
                region: $(tds[2]).text(),
                project: $(tds[3]).text(),
                license_number: $(tds[4]).text(),
                range: $(tds[5]).text(),
                count: $(tds[6]).text(),
                phone: $(tds[7]).text(),
                start: $(tds[8]).text(),
                end: $(tds[9]).text(),
                freeze: $(tds[10]).text(),
                status: $(tds[11]).text(),
            };
        })
        .get();

    const items = await Promise.all(
        sourceData.map(async (item) => {
            const rule = await fetchRule(ctx, item.uuid);
            return {
                title: item.region + ' - ' + item.project + ' - ' + item.status,
                description: `区域：${item.region}<br />
                预售证号：${item.license_number}<br />
                预售范围：${item.range}<br />
                住房套数：${item.count}<br />
                开发商咨询电话：${item.phone}<br />
                登记开始时间：${item.start}<br />
                登记结束时间：${item.end}<br />
                资格释放时间：${item.freeze}<br />
                报名状态：${item.status}<br />
                <details>
                    <summary>登记规则</summary>
                    <div style="border: 1px solid #233">${rule}</div>
                </details>`,
                guid: item.uuid + item.status,
                pubDate: item.start,
            };
        })
    );

    ctx.state.data = {
        title: '成都房源',
        link: 'https://zw.cdzj.chengdu.gov.cn/lottery/accept/projectList',
        description: '成都商品住房',
        item: items,
    };
};
