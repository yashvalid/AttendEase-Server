const { redisClient } = require("../config/redis");


const cache = (ttl = 300, keyFn = null) => async (req, res, next) => {
    const key = keyFn ? keyFn(req) : `cache:${req.originalUrl}`;
    try {
        const hit = await redisClient.get(key);
        if (hit)
            return res.status(200).json(JSON.parse(hit));
    } catch (err) {
        console.error("Redis read error:", err.message);
        return next();
    }

    const _json = res.json.bind(res);
    res.json = async (body) => {
        try {
            if (res.statusCode === 200)
                await redisClient.setEx(key, ttl, JSON.stringify(body));

        } catch (err) {
            console.error("Redis write error:", err.message);
        }
        return _json(body);
    };
    next();
};

const invalidateCache = async (patterns) => {
    const list = Array.isArray(patterns) ? patterns : [patterns];
    for (const pattern of list) {
        try {
            if (pattern.includes("*")) {
                let cursor = '0';
                let total = 0;
                do {
                    const { cursor: next, keys } = await redisClient.scan(cursor, {
                        MATCH: pattern,
                        COUNT: 100,
                    });

                    cursor = next;
                    if (keys.length) {
                        await redisClient.del(keys);
                        total += keys.length;
                    }
                } while (cursor !== '0');

                if (total)
                    console.log(`Busted ${total} key(s) matching "${pattern}"`);
            } else {
                const deleted = await redisClient.del(pattern);
                if (deleted)
                    console.log(`Busted key "${pattern}"`);
            }
        } catch (err) {
            console.error(`Redis invalidation error (${pattern}):`, err.message);
        }
    }
};

module.exports = { cache, invalidateCache };
