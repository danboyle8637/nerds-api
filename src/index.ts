import { Router } from 'itty-router'

import { handleAddToAirtable } from './handlers/handleAddToAirtable'

const router = Router()

router.post('/airtable', handleAddToAirtable)

addEventListener('fetch', (event) => {
  event.respondWith(router.handle(event.request))
})
