const AWS = require('aws-sdk')
AWS.config.update({
  region: process.env.REGION,
  endpoint: `http://dynamodb.${process.env.REGION}.amazonaws.com`,
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY
})
const dynamodb = new AWS.DynamoDB.DocumentClient()
const { v4: uuidv4 } = require('uuid');
const validator = require('validator')
const postsTable = 'postsTable'
const posts = '/posts'

exports.handler = async (event) => {
  let response;
  switch (true) {
    case event.httpMethod === 'GET' && event.path === posts:
      response = await getPost(event?.queryStringParameters)
      break;
    case event.httpMethod === 'POST' && event.path === posts:
      response = await createPost(JSON.parse(event.body));
      break;
    case event.httpMethod === 'PUT' && event.path === posts:
      response = await updatePost(JSON.parse(event.body));
      break;
    case event.httpMethod === 'DELETE' && event.path === posts:
      response = await deletePost(event?.queryStringParameters);
      break;
    default:
      response = {
        statusCode: 404,
        body: "not found"
      }
      break;
  }
  return response
}

async function createPost(requestBody) {
  requestBody.post_id = uuidv4()
  requestBody.updatedAt = (new Date()).toString()
  if (!validator.isEmail(requestBody?.owner)) {
    return buildResponse(400, {
      message: "Por favor insira um email válido."
    })
  }
  const params = {
    TableName: postsTable,
    Item: requestBody
  }
  return await dynamodb.put(params).promise().then(() => {
    const body = {
      Operation: 'SAVE',
      Message: 'SUCCESS',
      Item: requestBody
    }
    return buildResponse(201, body);
  }, (error) => {
    console.error('Erro ao incluir post', error);
  })
}

async function getPost(payload) {
  let body = {}
  if (payload?.post_id && payload?.owner) {
    body.post_id = payload?.post_id,
      body.owner = payload?.owner

    if (!validator.isEmail(payload?.owner)) {
      return buildResponse(400, {
        message: "Por favor insira um email válido."
      })
    }
    const params = {
      TableName: postsTable,
      Key: body
    }
    return await dynamodb.get(params).promise().then(response => {
      return buildResponse(200, response);
    }, error => {
      console.error("Error", error)
    })

  } else if (payload?.limit && payload?.page) {//pagination
    const page = Number(payload?.page)
    const limit = payload?.limit
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const results = {}
    const params = {
      TableName: postsTable,
      Key: {
      }
    }
    return await dynamodb.scan(params).promise().then(users => {
      if (endIndex < users.Items.length) {
        results.next = {
          page: Number(page + 1),
          limit: Number(limit)
        }
      }
      if (startIndex > 0) {
        results.previous = {
          page: Number(page - 1),
          limit: Number(limit)
        }
      }
      results.results = users.Items.slice(startIndex, endIndex)
      return buildResponse(200, results);
    }, error => {
      console.error("Error", error)
    })
  }

  else if (!payload?.post_id && payload?.owner) {
    const ownerPost = payload?.owner

    const params = {
      ExpressionAttributeNames: {
        '#owner': 'owner',
        '#name': 'name',
        '#text': 'text',
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':o': ownerPost
      },
      IndexName: 'owner-index',
      KeyConditionExpression: '#owner = :o',
      //FilterExpression: "#owner = :o", only for a second filter 
      ProjectionExpression: "post_id, #name, #owner, media, #text, #type, updatedAt",
      TableName: postsTable

    }
    return await dynamodb.query(params).promise().then(data => {
      return buildResponse(200, data.Items);
    }, error => {
      console.error("Error", error)
    })

  } else {
    const params = {
      TableName: postsTable,
      Key: {
      }
    }
    return await dynamodb.scan(params).promise().then(response => {
      return buildResponse(200, response.Items);
    }, error => {
      console.error("Error", error)
    })
  }


}

async function updatePost(payload) {
  if (!validator.isEmail(payload?.owner)) {
    return buildResponse(400, {
      message: "Por favor insira um email válido."
    })
  }
  const params = {
    TableName: postsTable,
    Item: payload
  }
  return await dynamodb.put(params).promise().then(response => {
    return buildResponse(200, { message: "Post editado com sucesso!" });
  }, error => {
    console.error("Error", error)
    return buildResponse(400, "Não foi possível editar post");
  })
}

async function deletePost(payload) {
  let body = {}
  if (!validator.isEmail(payload?.owner)) {
    return buildResponse(400, {
      message: "Por favor insira um email válido."
    })
  }
  if (payload?.post_id && payload?.owner) {
    body.post_id = payload?.post_id,
      body.owner = payload?.owner

    const params = {
      TableName: postsTable,
      Key: body
    }
    return await dynamodb.delete(params).promise().then(response => {
      return buildResponse(200, { message: "Post deletado com sucesso!" });
    }, error => {
      console.error("Error", error)
      return buildResponse(404, { message: "Post não encontrado" });
    })
  } else {
    return buildResponse(400, "Item not deleted");
  }
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}

//Usado somente para testes
// module.exports = {
//   createPost,
//   getPost,
//   updatePost,
//   deletePost,
//   buildResponse
// }