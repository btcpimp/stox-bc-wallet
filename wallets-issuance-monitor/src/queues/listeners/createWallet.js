const {services, context} = require('stox-bc-wallet-common')

module.exports = async ({body: request}) => {
    if (!request.error) {
         // TODO: is this the right property?
        await services.wallets.createWallet(request.transcations[0].to)
        // TODO: get wallet balance and transactions
        const balances = []
        if (balances) {
            context.mq.publish('blockchain-token-transfers', balances)
        }
    }
}
