const functions = {
  putUser: require('./users/putUser'),
  deleteUser: require('./users/deleteUser'),
  getUser: require('./users/getUser'),
  listUser: require('./users/listUser'),
  login: require('./users/login'),
  putProject: require('./projects/putProject')
}

module.exports.run = async (inputs = {}) => {
  const { fn, data } = inputs
  return functions[fn](data)
}
