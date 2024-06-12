import mongoist from 'mongoist'
import { createObjectCsvWriter } from 'csv-writer'
import path from 'path'
import _ from 'lodash'
import fs from 'fs'

const db = mongoist(process.env.MONGODB_URI as string)
const org = db[process.env.ORG as string]
const dir = path.join(__dirname, `../tmp`)

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const csvWriter = createObjectCsvWriter({
  path: `${dir}/${org}.csv`,
  header: [
    { id: 'c1', title: 'TITLE' },
    { id: 'c2', title: 'TEMPLATE' },
    { id: 'c3', title: 'QUESTION' },
  ],
})

const start = async () => {
  console.log('Fetching records...')

  const records: any[] = []
  const cursor = await org.findAsCursor({
    type: 'core.module.inspection',
    archived: { $exists: false },
    deleted: { $exists: false },
    'details.template.sections.0': { $exists: true },
  })

  for await (const doc of cursor) {
    const sections = _.get(doc, 'details.template.sections', [])

    _.map(sections, (section) => {
      const { questions } = section

      _.map(questions, (question) => {
        records.push({
          c1: doc.details.title,
          c2: section.title,
          c3: question.title,
        })
      })
    })
  }

  console.log('Creating csv...')
  await csvWriter.writeRecords(records)

  console.log('Done!')
}

start()
