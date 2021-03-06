const auth0 = require('auth0')
const redis = require('@funcmatic/simple-redis')
const jwtdecode = require('jwt-decode')

class Auth0Plugin {
  constructor() {
    this.name = 'auth0'
    this.cache = false
    this.cachedClient = null
  }

  async start(conf, env) {
    this.name == conf.name || this.name
    this.cache = conf.cache 
    this.domain = conf.domain || env.AUTH0_DOMAIN
    this.clientId = conf.clientId || env.AUTH0_CLIENTID
    this.skipAuth = conf.skipAuth || env.AUTH0_SKIP_AUTHENTICATION
    this.client = new auth0.AuthenticationClient({
      domain: this.domain,
      clientId: this.clientId
    })
    // REDIS
    this.redisEndpoint = conf.redisEndpoint || env.AUTH0_REDIS_ENDPOINT
    this.redisPassword = conf.redisPassword || env.AUTH0_REDIS_PASSWORD
    this.expiration = conf.expiration|| env.AUTH0_REDIS_EXPIRATION && parseInt(env.AUTH0_REDIS_EXPIRATION) || 1*60*60
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
    if (this.skipAuth) return this.noauth(token)
    if (!this.cache) return await this.auth(token)
    var expiration = this.expiration || 1*60*60 // 1 hr
    var client = await this.connectToRedis() 
    if (!force) {
      authorization = await client.get(token)
      //console.log("authorization", authorization)
      if (authorization) return JSON.parse(authorization)
    }
    authorization = await this.auth(token)
    //console.log("JSON.stringify", JSON.stringify(authorization))
    await client.set(token, JSON.stringify(authorization), 'EX', expiration)
    return authorization
  }
  
  noauth(token) {
    if (!token) {
      return authorizationError(new Error("No token provided"))
    } 
    try {
      var user = jwtdecode(token)
      return authorizationSuccess(user)
    } catch (err) {
      return authorizationError(err)
    }
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
      // if (user.error && user.error_description) {
      //   return authorizationError(new Error(`${user.error}: ${user.error_description}`))
      // }
     return authorizationSuccess(user)
    }
    return authorizationError(new Error("Unknown response from Auth0"))
  }
  
  async connectToRedis() {
    if (this.cache && this.cachedClient && this.cachedClient.client.connected) {
      return this.cachedClient
    }
    this.cachedClient = await redis.connect({ 
      uri: this.redisEndpoint, 
      password: this.redisPassword 
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