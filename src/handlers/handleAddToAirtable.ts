type FormType = 'quiz' | 'contact'

interface QuizFormReqBody {
  formType: FormType
  date: string
  firstName: string
  emailAddress: string
  primaryGoal: string
  haveWebsite: string
  websiteUrl: string
  haveTimeline: string
  idealTimeline: string
  haveBudget: string
  haveMarketingPlan: string
  numberOfProducts: string
  copyHelp: string
  moreDetails: string
}

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Origin': 'htts://nerdswhosell.com',
}

export async function handleAddToAirtable(request: Request): Promise<Response> {
  const formQuizUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/Project%20Quiz%20Form`
  const contactUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/Contact%20Form`
  const postmarkEndpoint = 'https://api.postmarkapp.com/email'

  const headers = request.headers
  const contentType: string = headers.get('content-type') || ''
  const method: string = request.method

  if (method === 'OPTIONS') {
    return new Response('OK', { headers: corsHeaders })
  }

  if (!contentType.includes('application/json')) {
    return new Response('Bad Request', { headers: { ...corsHeaders } })
  }

  if (method !== 'POST') {
    return new Response('Bad Request', { headers: { ...corsHeaders } })
  }

  const body: QuizFormReqBody = await request.json()

  const formType = body.formType
  const date = body.date
  const firstName = body.firstName
  const emailAddress = body.emailAddress
  const primaryGoal = body.primaryGoal
  const haveWebsite = body.haveWebsite
  const websiteUrl = body.websiteUrl || 'NA'
  const haveTimeline = body.haveTimeline
  const idealTimeline = body.idealTimeline || 'NA'
  const haveBudget = body.haveBudget
  const haveMarketingPlan = body.haveMarketingPlan
  const numberOfProducts = body.numberOfProducts || 'NA'
  const copyHelp = body.copyHelp || 'NA'
  const moreDetails = body.moreDetails || 'NA'

  if (!firstName || !emailAddress) {
    return new Response('Bad Request', { headers: { ...corsHeaders } })
  }

  const quizData = {
    records: [
      {
        fields: {
          Date: date,
          'First Name': firstName,
          Email: emailAddress,
          'Primary Goal': primaryGoal,
          'Have Website': haveWebsite,
          'Website Url': websiteUrl,
          'Have Timeline': haveTimeline,
          'Ideal Timeline': idealTimeline,
          'Have Budget': haveBudget,
          'Have Marketing Plan': haveMarketingPlan,
          'Number of Products': numberOfProducts,
          'Copy Help': copyHelp,
          'More Details': moreDetails,
        },
      },
    ],
  }

  const contactData = {
    records: [
      {
        fields: {
          Date: date,
          'First Name': firstName,
          Email: emailAddress,
          'Primary Goal': primaryGoal,
          'More Details': moreDetails,
        },
      },
    ],
  }

  const data = formType === 'quiz' ? quizData : contactData
  const endpoint = formType === 'quiz' ? formQuizUrl : contactUrl

  const airTableParams: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    body: JSON.stringify(data),
  }

  const htmlBody = `
    <html>
      <body>
        <p>Hey Dan! You just got a new lead from the website.</p>
        <p>It's ${
          formType === 'quiz' ? 'Quiz Form lead' : 'Contact lead'
        }. Go check Airtable and get back to the person.</p>
        <p>Let's see if this is a good deal!</p>
      </body>
    </html>
  `

  const emailData = {
    From: 'dan@nerdswhosell.com',
    To: 'dan@nerdswhosell.com',
    Subject: 'Lead From Website!',
    HtmlBody: htmlBody,
    MessageStream: 'lead-notification',
  }

  const postMarkParams: RequestInit = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': `${POSTMARK_TOKEN}`,
    },
    body: JSON.stringify(emailData),
  }

  try {
    await fetch(endpoint, airTableParams)

    await fetch(postmarkEndpoint, postMarkParams)

    return new Response('Recorded added. You will be contacted today.', {
      headers: { ...corsHeaders },
    })
  } catch {
    return new Response('Error saving your answers. Please try again.', {
      headers: { ...corsHeaders },
    })
  }
}
