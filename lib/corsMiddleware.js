   // lib/corsMiddleware.js
   import Cors from 'cors'

   // Initialize CORS middleware
   const cors = Cors({
     methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
     origin: 'http://localhost:3000', // Replace with your frontend URL
     credentials: true, // Allow credentials (cookies, authorization headers, etc.)
   })

   // Helper function to run middleware
   export function runMiddleware(req, res, fn) {
     return new Promise((resolve, reject) => {
       fn(req, res, (result) => {
         if (result instanceof Error) {
           return reject(result)
         }
         return resolve(result)
       })
     })
   }

   export default cors