var Funcmatic = require('@funcmatic/funcmatic')
var Auth0Plugin = require('../lib/auth0')

var EXPIRED_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9VUXdSRGhETXpZME5qTXhOa0ZHUWprelF6UXdOa0pETVRZMU0wUTBNa0pGUVRjNU5VSTFRZyJ9.eyJpc3MiOiJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTM2MjAxNTk3NjUzNTcxNTY4NTciLCJhdWQiOlsiaHR0cHM6Ly9mdW5jbWF0aWMuYXV0aDAuY29tL2FwaS92Mi8iLCJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNTI3NTQ0OTA3LCJleHAiOjE1Mjc1NTIxMDcsImF6cCI6IjlCa0NuMndreXcxZ2NqVGt3RjYzcVMyaU9qV001a2VUIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.PvuKP_c1Fpaor9UvwyOf6pgSkylST-wdYR7zau-tF7kt6Gtb0u4MEs9hTr6ydMDyjpHAkhc6Tdumq_vvEJkVcwtIWzycSTwdW8IfhKUWai1Dh3w7ZnVtPqxWesmK5ny8ytw36Km0Yt_aOpNeyUNQ3JACLe9UuVuY8wDA9mJXGZDOi2zBu03hBA0NssgOTpzfx1L1IHqi5H8leaIeQ2AgXWgVXIuK81k6UKHgqOLbqnVSpU7yllxystTKqL6NrpZ1Qn4Vkt33df2GrjHaeipOpep_LXxFG2DZ2nN6vcyjEQIsY_7QO7p9JIq-u_zRKnGhFHL65bJeQI0sNipPb5NpnQ"

var handler = Funcmatic.wrap(async (event, { auth0 }) => {
  return {
    statusCode: 200,
    auth0
  }    
})

describe('Without Cache', () => {
  beforeEach(() => {
    Funcmatic.clear()
  })
  it ('should deny an expired Auth0 Token', async () => {
    Funcmatic.use(Auth0Plugin, { 
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENTID,
      cache: false
    })
    var event = { 
      headers: {
        Authorization: `Bearer ${EXPIRED_TOKEN}`
      }
    }
    var context = { }
    var ret = await handler(event, context)
    expect(ret).toMatchObject({
      auth0: {
        authorized: false
      }
    })
    expect(ret.auth0.errorMessage).toBe("Unauthorized")
    
    // verify that we are not caching 
    var ret2 = await handler(event, context)
    expect(ret2.auth0.authorized_at > ret.auth0.authorized_at).toBe(true)
    
  })
})

describe('With Cache', () => {
  beforeEach(() => {
    Funcmatic.clear()
  })
  afterEach(async () => {
    if (Auth0Plugin.cachedClient && Auth0Plugin.cachedClient.client.connected) {
      await Auth0Plugin.cachedClient.quit()
    }
  })
  it ('should deny an expired Auth0 Token', async () => {
    Funcmatic.use(Auth0Plugin, { 
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENTID,
      cache: true,
      redisEndpoint: process.env.AUTH0_REDIS_ENDPOINT,
      redisPassword: process.env.AUTH0_REDIS_PASSWORD
    })
    var event = { 
      headers: {
        Authorization: `Bearer ${EXPIRED_TOKEN}`,
        'X-Funcmatic-Force-Authorization': 'true'
      }
    }
    var context = { }
    var t1 = (new Date()).getTime()
    var ret = await handler(event, context)
    var t2 = (new Date()).getTime()
    expect(ret).toMatchObject({
      auth0: {
        authorized: false
      }
    })
    expect(ret.auth0.errorMessage).toBe("Unauthorized")
    // fetch again and should come back from catche
    event.headers['X-Funcmatic-Force-Authorization'] = 'false'
    var t3 = (new Date()).getTime()
    var ret2 = await handler(event, context)
    var t4 = (new Date()).getTime()
    expect(ret2.auth0.authorized_at == ret.auth0.authorized_at).toBe(true)
    console.log('force', t2 - t1)
    console.log('cached', t4 - t3)
  })
}) 