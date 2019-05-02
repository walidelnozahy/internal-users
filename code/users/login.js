const aws = require('aws-sdk')
const crypto = require('crypto')
var jwt = require('jsonwebtoken')

const dynamodb = new aws.DynamoDB.DocumentClient()

module.exports = async (event) => {
  const { username, password } = event
  const hashedPassword = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex')
  const params = {
    TableName: process.env.USERS_TABLE
  }
  const users = await dynamodb.scan(params).promise()
  const user = users.Items.find(
    (item) => item.username === username && item.password === hashedPassword
  )

  if (user) {
    delete user.password
    return {
      token: jwt.sign(user, process.env.TOKEN_SECRET)
    }
  }
  throw Error('user not found')
}
