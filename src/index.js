// import axios from 'axios'
// import fs from 'fs/promises'
// import path from 'path'

const pageLoader = (url, output) => {
  return `open ${getAbsolutePathToTarget(url, output)}`
}

const getAbsolutePathToTarget = (filepath, targetDir) => {
  const urlData = filepath.replace(/https?:\/\//i, '').split('/')
  const targetUrl = urlData[0].replace(/[^a-zA-Z0-9]/g, '-')
  const targetFile = urlData[urlData.length - 1] + '.html'

  return targetDir + '/' + [targetUrl, targetFile].join('-')
}

export default pageLoader
