module.exports = (addRpcRoute) => {
  addRpcRoute('getABI', ({headers, body: {address}}) => `Your address is - ${address}`)
}
