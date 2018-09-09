const auth0 = require('auth0')
const redis = require('@funcmatic/simple-redis')

class Auth0Plugin {
  constructor() {
    this.name = 'auth0'
    this.cache = false
    this.cachedClient = null
  }
  
  async start(conf) {
    this.conf = conf
    this.name == conf.name || this.name
    this.cache = conf.cache 
    this.client = new auth0.AuthenticationClient({
      domain: conf.domain,
      clientId: conf.clientId
    })
  }
  
  async request(event, context) {
    var force = false
    event.headers = event.headers || {} 
    if (event.headers['X-Funcmatic-Force-Authorization'] == 'true') force = true
    var authorization = await this.authCache(stripBearer(event.headers['Authorization']), force)
    context[this.name] = authorization
    var service = authorization
    return { service }
  }

  async end(options) {
    if (options.teardown || !this.cache) {
      if (this.cachedClient) {
        await this.cachedClient.quit()
      }
    }
  }
  
  async authCache(token, force) {
    var authorization = null
    if (!this.cache) return await this.auth(token)
    var expiration = this.conf.expiration || 1*60*60 // 1 hr
    var client = await this.connectToRedis() 
    if (!force) {
      authorization = await client.get(token)
      console.log("authorization", authorization)
      if (authorization) return JSON.parse(authorization)
    }
    authorization = await this.auth(token)
    console.log("JSON.stringify", JSON.stringify(authorization))
    await client.set(token, JSON.stringify(authorization), 'EX', expiration)
    return authorization
  }
  
  async auth(token) {
    var user = null
    if (!token) { 
      return authorizationError(new Error("No token provided"))
    }
    try {
      user = await this.client.users.getInfo(token)
    } catch (err) {
      return authorizationError(err)
    }
    if (typeof user == 'string') {
      return authorizationError(new Error(user))
    }
    if (typeof user == 'object') {
     return authorizationSuccess(user)
    }
    return authorizationError(new Error("Unknown response from Auth0"))
  }
  
  async connectToRedis() {
    if (this.cache && this.cachedClient && this.cachedClient.client.connected) {
      return this.cachedClient
    }
    this.cachedClient = await redis.connect({ 
      uri: this.conf.redisEndpoint, 
      password: this.conf.redisPassword 
    })
    return this.cachedClient
  }

  async disconnectFromRedis() {

  }
}

function stripBearer(Authorization) {
  if (Authorization && Authorization.startsWith('Bearer')) {
    return Authorization.split(' ')[1]
  }
  return Authorization
}

function authorizationSuccess(user) {
  return {
    authorized: true,
    authorized_at: (new Date()).getTime(),
    user
  }
}

function authorizationError(err) {
  return {
    authorized: false,
    authorized_at: (new Date()).getTime(),
    error: true,
    errorMessage: err.message
  }
}


module.exports = Auth0Plugin

// class A {
//   constructor(fooVal) {
//     this.foo = fooVal;
//   }
// }

// class AFactory {
//   static async create() {
//     return new A(await Promise.resolve('fooval'));
//   }
// }

// (async function generate() {
//   const aObj = await AFactory.create();
//   console.log(aObj);
// })()