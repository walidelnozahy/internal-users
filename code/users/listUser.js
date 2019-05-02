const aws = require('aws-sdk')
const dynamodb = new aws.DynamoDB.DocumentClient()
const jwt = require('jsonwebtoken')

const validate = async (event) => {
  if (event.role && event.role !== 'admin') {
    throw Error('only admin can access users ')
  }
}

module.exports = async (event) => {
  const { token } = event
  let decoded
  try {
    decoded = jwt.verify(token, process.env.TOKEN_SECRET)
  } catch (e) {
    throw Error('Unauthorized')
  }

  if (decoded.role === 'admin') {
    await validate(event)

    const params = {
      TableName: process.env.USERS_TABLE
    }
    return dynamodb.scan(params).promise()
  }
  throw Error('only admin can acccess users')
}
