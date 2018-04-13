'use strict'

const Redis = require('ioredis')
const toTime = require('to-time')

const DEFAULT_CACHE_TTL = '15 days'

class TusS3Redis {
    constructor(options) {
        this.keyPrefix = options.keyPrefix || 'tus:s3:cache'
        this.ttl = toTime(options.ttl || DEFAULT_CACHE_TTL).seconds()
        this.storage = new Redis({
            host: options.host,
            port: options.port,
        })
    }

    get(key) {
        return this.storage.get(`${this.keyPrefix}__${key}`)
            .then((data) => JSON.parse(data))
            .catch((err) => { throw err })
    }

    set(key, data) {
        const fullKey = `${this.keyPrefix}__${key}`

        return this.storage
            .multi()
            .set(fullKey, JSON.stringify(data))
            .expire(fullKey, this.ttl)
            .get(fullKey)
            .exec()
            .then(([, , [, response]]) => JSON.parse(response))
            .catch((err) => { throw err })
    }

    del(key) {
        return this.storage.del(`${this.keyPrefix}__${key}`);
    }
}

module.exports = TusS3Redis
