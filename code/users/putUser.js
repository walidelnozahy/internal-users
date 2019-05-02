const aws = require('aws-sdk')
const dynamodb = new aws.DynamoDB.DocumentClient()
const jwt = require('jsonwebtoken')
const shortid = require('shortid')

const validate = async (event) => {
  if (event.role && event.role === 'admin') {
    throw Error('only one admin allowed')
  }

  if (!event.username) {
    throw Error('please provide a username')
  }

  const params = {
    TableName: process.env.USERS_TABLE
  }
  const users = await dynamodb.scan(params).promise()
  const user = users.Items.find((item) => item.username === event.username)
  if (user && !event.id) {
    throw Error('username taken')
  }

  if (event.profile && typeof event.profile !== 'object') {
    throw Error('profile is not valid')
  }
}

module.exports = async (event) => {
  const { token, id } = event
  let decoded
  try {
    decoded = jwt.verify(token, process.env.TOKEN_SECRET)
  } catch (e) {
    throw Error('Unauthorized')
  }

  if (decoded.role === 'admin') {
    await validate(event)

    const params = {
      Item: {
        date: Date.now(),
        id: id || shortid(),
        username: event.username,
        password: event.password || shortid(),
        role: event.role || 'user',
        profile: event.profile || {}
      },
      TableName: process.env.USERS_TABLE
    }
    await dynamodb.put(params).promise()
    return params.Item
  }
  throw Error('only admin can create / update users')
}
