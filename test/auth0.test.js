require('dotenv').config()
var funcmatic = require('@funcmatic/funcmatic')
var Auth0Plugin = require('../lib/auth0')

var EXPIRED_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9VUXdSRGhETXpZME5qTXhOa0ZHUWprelF6UXdOa0pETVRZMU0wUTBNa0pGUVRjNU5VSTFRZyJ9.eyJpc3MiOiJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTM2MjAxNTk3NjUzNTcxNTY4NTciLCJhdWQiOlsiaHR0cHM6Ly9mdW5jbWF0aWMuYXV0aDAuY29tL2FwaS92Mi8iLCJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNTI3NTQ0OTA3LCJleHAiOjE1Mjc1NTIxMDcsImF6cCI6IjlCa0NuMndreXcxZ2NqVGt3RjYzcVMyaU9qV001a2VUIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.PvuKP_c1Fpaor9UvwyOf6pgSkylST-wdYR7zau-tF7kt6Gtb0u4MEs9hTr6ydMDyjpHAkhc6Tdumq_vvEJkVcwtIWzycSTwdW8IfhKUWai1Dh3w7ZnVtPqxWesmK5ny8ytw36Km0Yt_aOpNeyUNQ3JACLe9UuVuY8wDA9mJXGZDOi2zBu03hBA0NssgOTpzfx1L1IHqi5H8leaIeQ2AgXWgVXIuK81k6UKHgqOLbqnVSpU7yllxystTKqL6NrpZ1Qn4Vkt33df2GrjHaeipOpep_LXxFG2DZ2nN6vcyjEQIsY_7QO7p9JIq-u_zRKnGhFHL65bJeQI0sNipPb5NpnQ"
var INVALID_CREDENTIALS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5FTXdNakF5TXpnME9EWXhSVEUzTWpOQ05qazNNek13UmpZMU9FUkdSamMyUkVFelFrUkJSUSJ9.eyJnaXZlbl9uYW1lIjoiRGFuaWVsIEpoaW4iLCJmYW1pbHlfbmFtZSI6IllvbyIsIm5pY2tuYW1lIjoiZGFuaWVsanlvbyIsIm5hbWUiOiJEYW5pZWwgSmhpbiBZb28iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tLy1MVW0ydnlZY0xUYy9BQUFBQUFBQUFBSS9BQUFBQUFBQUFDTS9BZk02ZDVTTkU0US9waG90by5qcGciLCJnZW5kZXIiOiJtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoiMjAxOC0xMi0xMFQwNDoyODo0NS43MTlaIiwiZW1haWwiOiJkYW5pZWxqeW9vQGdvYWxib29rYXBwLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL3N1cGVyc2hlZXRzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDEwNzc2NDEzOTAwNDgyODczNzMyNiIsImF1ZCI6IlJrcFZldDlwem9yMmhaSjAxMkhoMXZwbnJBbFBxWm12IiwiaWF0IjoxNTQ0NDE4MDMxLCJleHAiOjE1NDQ0NTQwMzEsImF0X2hhc2giOiJsMXNFRC1JclBKbFdBNnhWMjNadVpRIiwibm9uY2UiOiJpSjd5UkN2VFZ2YkhLVnh1Wi1IVmUxMk9Kdmd2VjZhUCJ9.zPzNIR0DqvXDpqz7SYq0CwzYN2r6kIyc4J1Fn4DfGbKCluIj2wPuNo_oSDABgii5W7Pw4RI8eYgyq3Yga4urFNPjpS87Z9-4fQ0G00Q-2L4AtHihNqnyb0VjmzWkR1iKao3wYzOLTurrse1uwg4f8KTTDGsL5WRCdfiCd_GgK7kUuKiIRiRn7FfsvcS4eMidMt7wo2rBahBXvRAlwaOxWx6HN7J5TwlcAGkkJW2fc2nd3jXKpRk44l9ZDHQuhR-g63JPdJtSfScVP2JkvALTLW9lV_76lhHLPoR5B5DuVoyFurgePKVZLOropRcuc18BwsA99-gmaWbhfBPYBeO9ww"
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
  it ('should deny an invalid Auth0 Token', async () => {
    var event = { 
      headers: {
        Authorization: `Bearer ${INVALID_CREDENTIALS_TOKEN}`
      }
    }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      expect(auth0).toMatchObject({
        authorized: false,
        //errorMessage: 'unauthorized: invalid credentials'
      })
    })
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

describe('Skip authentication (dev mode)', async () => {
  const SUPERSHEETS_ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5FTXdNakF5TXpnME9EWXhSVEUzTWpOQ05qazNNek13UmpZMU9FUkdSamMyUkVFelFrUkJSUSJ9.eyJpc3MiOiJodHRwczovL3N1cGVyc2hlZXRzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDEwNzc2NDEzOTAwNDgyODczNzMyNiIsImF1ZCI6WyJodHRwczovL3N1cGVyc2hlZXRzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaHR0cHM6Ly9zdXBlcnNoZWV0cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNTQ0OTM2NTIzLCJleHAiOjE1NDQ5NDM3MjMsImF6cCI6IlJrcFZldDlwem9yMmhaSjAxMkhoMXZwbnJBbFBxWm12Iiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.iAf1X-pqAZKpaAgz2Jfv9L7iDaaylk0Bo6KaQnMvfpNxi81hK1S4p7AtCl39HPPuOmX94bCp4YVO4IwLoC4_4qZxsC2aZgh_BTlu6VOYIkqOVqMHtxZld48FQfBhCR4JXkfy6mhz8S2tIoF2lQuenhXpWgsguetBO-enTuExHkY8zTvCqX6QRQT3HdTTvSxK3bGTUXTRo3EiOKCOWpu7wNiXAV7XHI_XKIuIT9FLp7MDN2VE505ON0MwjJHCdfN2IBjon-2znBew1o45JVwsHOPZSVzmylqxeO7EHy3HFUhFA_vVIXyYp4ddfMF8n0oTDy1VL5DYj2CfD_l9IxAG0w"
  const SUPERSHEETS_ID_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5FTXdNakF5TXpnME9EWXhSVEUzTWpOQ05qazNNek13UmpZMU9FUkdSamMyUkVFelFrUkJSUSJ9.eyJnaXZlbl9uYW1lIjoiRGFuaWVsIEpoaW4iLCJmYW1pbHlfbmFtZSI6IllvbyIsIm5pY2tuYW1lIjoiZGFuaWVsanlvbyIsIm5hbWUiOiJEYW5pZWwgSmhpbiBZb28iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tLy1MVW0ydnlZY0xUYy9BQUFBQUFBQUFBSS9BQUFBQUFBQUFDTS9BZk02ZDVTTkU0US9waG90by5qcGciLCJnZW5kZXIiOiJtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoiMjAxOC0xMi0xNlQwNTowMjowMi4zMDlaIiwiZW1haWwiOiJkYW5pZWxqeW9vQGdvYWxib29rYXBwLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL3N1cGVyc2hlZXRzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDEwNzc2NDEzOTAwNDgyODczNzMyNiIsImF1ZCI6IlJrcFZldDlwem9yMmhaSjAxMkhoMXZwbnJBbFBxWm12IiwiaWF0IjoxNTQ0OTM2NTIzLCJleHAiOjE1NDQ5NzI1MjMsImF0X2hhc2giOiJzMjZKMUEzckRJMWYtSE9tLUk4MnNBIiwibm9uY2UiOiJffm1vR2RLNDc1eDhSakt4MmhocTRuc2JQQzdfaTZvaCJ9.bDwbfHZQJvVD1op5ljOv6W796_UwTzJ5jowENKRAnu9i3X8i00CjjxabbcdeQ4jcHgTXNZ9gRVKocEJ8wvtBst2rcuvH2mnnmS2AScG51puXFpG8Ich7JIsuZOuB4YsZQwvEVcw8shXXzjH3YHLLsznCI42GPslaPq_0azGvcWwd3PEvdnEk1R_cqfzoP5AieDGCgWvhjBB_yF7vM5DI8yUhDFiAwS-mgxoPP8UjO84kitEC34DMmaOst1ivR3ZDZwvXBbezCFQPR8nZkGqTsuCXWhqjFbUNVVkId5oatvvW0iE9m9os47b5hLqTupHfA97JaGD3mBbgGQywazDQ0g"
  beforeEach(() => {
    funcmatic = funcmatic.clone()
    funcmatic.use(Auth0Plugin, {
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENTID,
      skipAuth: true
    })
  })
  it ('should return unauthorized if token is falsey', async () => {
    var event = { 
      headers: {
        Authorization: ``,
      }
    }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      expect(auth0).toMatchObject({
        authorized: false
      })
    })
  })
  it ('should return unauthorized if token in invalid JWT format', async () => {
    var event = { 
      headers: {
        Authorization: `Bearer BAD-JWT-TOKEN`,
      }
    }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      expect(auth0).toMatchObject({
        authorized: false
      })
    })
  })
  it ('should return authorized if token is valid JWT format', async () => {
    var event = { 
      headers: {
        Authorization: `Bearer ${SUPERSHEETS_ID_TOKEN}`,
      }
    }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { auth0 }) => {
      console.log("Supersheets", auth0)
      expect(auth0).toMatchObject({
        authorized: true,
        user: {
          email: "danieljyoo@goalbookapp.com"
        }
      })
    })
  })
})

/*
var jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "https://funcmatic.auth0.com/.well-known/jwks.json"
    }),
    audience: 'https://test.funcmatic.io/api',
    issuer: "https://funcmatic.auth0.com/",
    algorithms: ['RS256']
});

app.use(jwtCheck);

app.get('/authorized', function (req, res) {
  res.send('Secured Resource');
});

app.listen(port);


Machine-to-Machine

curl --request POST \
  --url https://funcmatic.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"T0AN7lVhVJhX3AGXDm1lqTfgO4NcsFPy","client_secret":"g2EXoLj4jBuDIMum_pmyWfMjp_jgpzeIgEm_NtwWr6aWH1IsbBmzthPxgV81GA5M","audience":"https://test.funcmatic.io/api","grant_type":"client_credentials"}'


{"access_token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9VUXdSRGhETXpZME5qTXhOa0ZHUWprelF6UXdOa0pETVRZMU0wUTBNa0pGUVRjNU5VSTFRZyJ9.eyJpc3MiOiJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vIiwic3ViIjoiVDBBTjdsVmhWSmhYM0FHWERtMWxxVGZnTzROY3NGUHlAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vdGVzdC5mdW5jbWF0aWMuaW8vYXBpIiwiaWF0IjoxNTQ0NDIwNzI0LCJleHAiOjE1NDQ1MDcxMjQsImF6cCI6IlQwQU43bFZoVkpoWDNBR1hEbTFscVRmZ080TmNzRlB5IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.A5j4i0tBpHPKvHmbNXl3qBZTwUJFGc4YRHHRzdJ5n_RvQ93yui5HTFX6VtaB8eCCuEvT2iFCF41Z13_spraAhNirmctmzHiWQdWXicMwkg9bJWJrd9k8CjCcgKoifXy00GW3e8DCXD9RMJ3qibUdTelsM6k6iYY0fx0nQsmkbuasHjlOlhL6szv5ISet2d5S6XV6qX014KLoKf9IMwPEfpaXTJAH4uEXKbnHqkUGHcEnVW6zdY5BjSDk7N-1VJqTEXDvUqTcWdaf1xr2vuduwK5T4ctKgmO_qpSHVbojE-4fmigPdMEqcaem5-eoo5rXM68F5Utpvssezz5qhdByAw","expires_in":86400,"token_type":"Bearer"}

*/
