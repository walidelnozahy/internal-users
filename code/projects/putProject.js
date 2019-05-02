const aws = require('aws-sdk')
const dynamodb = new aws.DynamoDB.DocumentClient()
const jwt = require('jsonwebtoken')
const shortid = require('shortid')
// You have the following validation errors:
// - error 1
const validate = async (event) => {
  const errors = []
  if (event.published) {
    if (!event.name) {
      errors.push('- please provide project name')
    }
    if (!event.code) {
      errors.push('- please provide project code')
    }
    if (
      event.installment &&
      (typeof event.installment !== 'object' ||
        !event.installment.payment ||
        !event.installment.period)
    ) {
      errors.push('- please provide a valid installment plan')
    }
    if (!event.price.min || !event.price.max) {
      errors.push('- please provide project min and max price')
    }
    if (!event.location.lng || !event.location.lat) {
      errors.push('- please provide project location')
    }
    if (!event.imagesIds || event.imagesIds.length === 0) {
      errors.push('- please upload atleast one image')
    }
    if (!event.coverImageId) {
      errors.push('- please upload cover image image')
    }
    if (!event.languages.en.description || !event.languages.ar.description) {
      errors.push('- please provide project description')
    }
    if (!event.languages.en.city || !event.languages.ar.city) {
      errors.push('- please choose city')
    }
    if (!event.languages.en.district.name || !event.languages.ar.district.name) {
      errors.push('- please choose district')
    }
    if (!event.languages.en.summary || !event.languages.ar.summary) {
      errors.push('- please choose district')
    }
    if (event.types.length === 0) {
      errors.push('- please select atleast one type')
    } else {
      event.types.map((type) => {
        if (!type.area.min || !type.area.max) {
          errors.push('- please enter all types min and max area')
        }
        if (!type.price.min || !type.price.max) {
          errors.push('- please enter all types min and max price')
        }
      })
    }
    const params = {
      TableName: process.env.USERS_TABLE
    }
    const projects = await dynamodb.scan(params).promise()
    const project = projects.Items.find((item) => item.code === event.code)
    if (project) {
      errors.push('- project with this code already exist')
    }
    if (errors.length > 0) {
      const errorsList = errors.join('\n')
      throw Error(`You have the following validation errors:
        ${errorsList}`)
    }
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

  if (decoded.role === 'admin' || decoded.role === 'projectManager') {
    await validate(event)

    const params = {
      Item: {
        id: id || shortid(),
        createdAt: event.createdAt || Date.now(),
        updatedAt: Date.now(),
        name: event.name || null,
        code: event.code || null,
        published: event.published || false,
        ready: event.ready || false,
        delivery: event.delivery || null,
        installment:
          {
            payment: event.installment.payment || null,
            period: event.installment.period || null
          } || null,
        nearby: event.nearby || null,
        price: {
          min: event.price.min || null,
          max: event.price.max || null
        },
        location:
          {
            lng: event.location.lng || null,
            lat: event.location.lat || null
          } || null,
        imagesIds: event.imagesIds || null,
        coverImageId:
          event.coverImageId || (event.imagesIds && event.imagesIds.length > 0)
            ? event.imagesIds[0]
            : null,
        languages: {
          en: {
            description: event.languages.en.description || null,
            city: event.languages.en.city || null,
            side: event.languages.en.side || null,
            district: {
              name: event.languages.en.district.name || null,
              description: event.languages.en.district.description || null
            },
            privileges: event.languages.en.privileges || null,
            video: event.languages.en.video || null,
            summary: event.languages.en.summary || null
          },
          ar: {
            description: event.languages.ar.description || null,
            city: event.languages.ar.city || null,
            side: event.languages.ar.side || null,
            district: {
              name: event.languages.ar.district.name || null,
              description: event.languages.ar.district.description || null
            },
            privileges: event.languages.ar.privileges || null,
            video: event.languages.ar.video || null,
            summary: event.languages.ar.summary || null
          }
        },
        types: event.types || null
      },
      TableName: process.env.USERS_TABLE
    }
    await dynamodb.put(params).promise()
    return params.Item
  }
  throw Error('only admin can create / update projects')
}
