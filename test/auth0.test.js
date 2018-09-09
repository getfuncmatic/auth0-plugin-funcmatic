require('dotenv').config()
var funcmatic = require('@funcmatic/funcmatic')
var Auth0Plugin = require('../lib/auth0')

var EXPIRED_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9VUXdSRGhETXpZME5qTXhOa0ZHUWprelF6UXdOa0pETVRZMU0wUTBNa0pGUVRjNU5VSTFRZyJ9.eyJpc3MiOiJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTM2MjAxNTk3NjUzNTcxNTY4NTciLCJhdWQiOlsiaHR0cHM6Ly9mdW5jbWF0aWMuYXV0aDAuY29tL2FwaS92Mi8iLCJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNTI3NTQ0OTA3LCJleHAiOjE1Mjc1NTIxMDcsImF6cCI6IjlCa0NuMndreXcxZ2NqVGt3RjYzcVMyaU9qV001a2VUIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.PvuKP_c1Fpaor9UvwyOf6pgSkylST-wdYR7zau-tF7kt6Gtb0u4MEs9hTr6ydMDyjpHAkhc6Tdumq_vvEJkVcwtIWzycSTwdW8IfhKUWai1Dh3w7ZnVtPqxWesmK5ny8ytw36Km0Yt_aOpNeyUNQ3JACLe9UuVuY8wDA9mJXGZDOi2zBu03hBA0NssgOTpzfx1L1IHqi5H8leaIeQ2AgXWgVXIuK81k6UKHgqOLbqnVSpU7yllxystTKqL6NrpZ1Qn4Vkt33df2GrjHaeipOpep_LXxFG2DZ2nN6vcyjEQIsY_7QO7p9JIq-u_zRKnGhFHL65bJeQI0sNipPb5NpnQ"

// var handler = Funcmatic.wrap(async (event, { auth0 }) => {
//   return {
//     statusCode: 200,
//     auth0
//   }    
// })

describe('Without Cache', () => {
  var plugin = null
  beforeEach(() => {
    funcmatic = funcmatic.clone()
    funcmatic.use(Auth0Plugin, {
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENTID,
      cache: false
    })
    plugin = funcmatic.getPlugin('auth0')
  })
  afterEach(async () => {
    await funcmatic.teardown()
  })
  it ('should create an auth0 service', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      expect(auth0).toBeTruthy()
    })
  })
  it ('should deny an expired Auth0 Token', async () => {
    var event = { 
      headers: {
        Authorization: `Bearer ${EXPIRED_TOKEN}`
      }
    }
    var context = { }
    var authorizedAt1 = null
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      expect(auth0).toMatchObject({
        authorized: false,
        errorMessage: "Unauthorized"
      })
      authorizedAt1 = auth0.authorized_at
    })
    // verify that we are not caching 
    var authorizedAt2 = null
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      authorizedAt2 = auth0.authorized_at
    })
    expect(authorizedAt2 > authorizedAt1).toBe(true)
  })
})

describe('With Cache', () => {
  beforeEach(() => {
    funcmatic = funcmatic.clone()
    funcmatic.use(Auth0Plugin, {
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENTID,
      cache: true,
      redisEndpoint: process.env.AUTH0_REDIS_ENDPOINT,
      redisPassword: process.env.AUTH0_REDIS_PASSWORD
    })
    plugin = funcmatic.getPlugin('auth0')
  })
  afterEach(async () => {
    await funcmatic.teardown()
  })
  it ('should deny an expired Auth0 Token', async () => {
   var event = { 
      headers: {
        Authorization: `Bearer ${EXPIRED_TOKEN}`,
        'X-Funcmatic-Force-Authorization': 'true'
      }
    }
    var context = { }
    var t1 = (new Date()).getTime()
    var authorizedAt1 = null
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      expect(auth0).toMatchObject({
        authorized: false,
        errorMessage: "Unauthorized"
      })
      authorizedAt1 = auth0.authorized_at
    })
    var t2 = (new Date()).getTime()
    // fetch again and should come back from catche
    event.headers['X-Funcmatic-Force-Authorization'] = 'false'
    var t3 = (new Date()).getTime()
    var authorizedAt2 = null
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      expect(auth0).toMatchObject({
        authorized: false,
        errorMessage: "Unauthorized"
      })
      authorizedAt2 = auth0.authorized_at
    })
    var t4 = (new Date()).getTime()
    expect(authorizedAt1 == authorizedAt2).toBe(true)
    // console.log('force', t2 - t1)
    // console.log('cached', t4 - t3)
  }, 5 * 60 * 1000)
}) 