let queues = {}
let exchanges = {}
let channel = {
    async assertQueue(queue, qOptions) {
        setIfUndef(queues, queue, {
            messages: [],
            subscribers: [],
            options: qOptions,
        })
    },

    async sendToQueue() {
        return {}
    },

    async assertExchange(exchange, type, exchOptions) {
        exchOptions = exchOptions || {}
        setIfUndef(exchanges, exchange, {
            bindings: [],
            options: exchOptions,
            type: type,
        })
    },

    async bindQueue(queue, exchange, key) {
        if (!exchanges[exchange]) throw new Error('Bind to non-existing exchange ' + exchange)

        const re =
            '^' +
            key
                .replace('.', '\\.')
                .replace('#', '(\\w|\\.)+')
                .replace('*', '\\w+') +
            '$'

        exchanges[exchange].bindings.push({
            regex: new RegExp(re),
            queueName: queue,
        })
    },

    async publish(exchange, routingKey, content, props) {
        if (!exchanges[exchange]) throw new Error('Publish to non-existing exchange ' + exchange)

        let bindings = exchanges[exchange].bindings

        let matchingBindings = bindings.filter(b => b.regex.test(routingKey))

        matchingBindings.forEach(function(binding) {
            let subscribers = queues[binding.queueName] ? queues[binding.queueName].subscribers : []
            subscribers.forEach(function(sub) {
                let message = {
                    fields: { routingKey: routingKey },
                    properties: props,
                    content: content,
                }
                sub(message)
            })
        })
    },

    async consume(queue, handler) {
        queues[queue].subscribers.push(handler)
    },

    async deleteQueue(queue) {
        setImmediate(function() {
            delete queues[queue]
        })
    },

    async ack() {},
    async nack() {},
    async prefetch() {},
    async on() {},
    async close() {
        return {}
    },
}

async function createChannel() {
    return channel
}
async function connect() {
    let connection = {
        createChannel: createChannel,
        createConfirmChannel: createChannel,
        on() {},
        async close() {},
    }

    return connection
}

function resetMock() {
    queues = {}
    exchanges = {}
}

module.exports = {
    connect,
    resetMock,
}

function setIfUndef(object, prop, value) {
    if (!object[prop]) {
        object[prop] = value
    }
}
