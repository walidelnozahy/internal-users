const { Component, sleep } = require('@serverless/components')
const aws = require('aws-sdk')
const dynamodb = new aws.DynamoDB.DocumentClient()
const shortid = require('shortid')
const crypto = require('crypto')

class RealEstateBackEnd extends Component {
  async default() {
    this.cli.status('Deploying')

    const userId = this.state.userId || shortid()
    const userName = 'admin'
    const userPassword = this.state.userPassword || shortid()
    const usersTable = 'internal-users'
    const projectsTable = 'projects'
    const tokenSecret = this.state.tokenSecret || shortid()

    const awsDynamoDbUsers = await this.load('@serverless/aws-dynamodb', 'usersTable')
    const awsDynamoDbProjects = await this.load('@serverless/aws-dynamodb', 'projectsTable')
    const awsLambda = await this.load('@serverless/aws-lambda')

    await awsDynamoDbUsers({
      name: usersTable
    })
    await awsDynamoDbProjects({
      name: projectsTable
    })

    if (!this.state.userId) {
      await sleep(10000)
    }

    const params = {
      Item: {
        date: Date.now(),
        id: userId,
        username: userName,
        password: crypto
          .createHash('sha256')
          .update(userPassword)
          .digest('hex'),
        role: 'admin',
        profile: {}
      },
      TableName: usersTable
    }

    await dynamodb.put(params).promise()

    this.state.userId = userId
    this.state.userName = userName
    this.state.userPassword = userPassword
    this.state.tokenSecret = tokenSecret
    await this.save()

    await awsLambda({
      name: 'real-estate-backend',
      code: './code',
      handler: 'index.run',
      env: {
        USERS_TABLE: usersTable,
        PROJECTS_TABLE: usersTable,
        TOKEN_SECRET: tokenSecret
      }
    })

    this.cli.outputs({ userName, userPassword })
  }
  async remove() {
    this.cli.status('removing')
    const awsDynamoDbUsers = await this.load('@serverless/aws-dynamodb', 'usersTable')
    const awsDynamoDbProjects = await this.load('@serverless/aws-dynamodb', 'projectsTable')
    const awsLambda = await this.load('@serverless/aws-lambda')
    await awsDynamoDbUsers.remove()
    await awsDynamoDbProjects.remove()
    await awsLambda.remove()
  }
}
module.exports = RealEstateBackEnd
