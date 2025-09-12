import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'

const options = {
  init: {
    licenseKey: process.env.REACT_APP_NEWRELIC_LICENSE_KEY,
    applicationID: process.env.REACT_APP_NEWRELIC_FRONTEND_APPID,
    beacon: 'bam.nr-data.net',
    errorBeacon: 'bam.nr-data.net'
  },
  distributedTracing: { enabled: true }
}

new BrowserAgent(options)
