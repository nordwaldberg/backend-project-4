import axios from 'axios'
import fs from 'fs/promises'
// import path from 'path'

const pageLoader = async (url, output) => {
  const targetPath = getAbsolutePathToTarget(url, output)

  return axios.get(url).then((response) => {
    fs.writeFile(targetPath, response.data)
  }).then(() => {
    return `open ${targetPath}`
  }).catch((err) => {
    console.error('Error downloading web page:', err)
    throw err
  })
}

const getAbsolutePathToTarget = (filepath, targetDir) => {
  const urlData = filepath.replace(/https?:\/\//i, '').split('/')
  const targetUrl = urlData[0].replace(/[^a-zA-Z0-9]/g, '-')
  const targetFile = urlData[urlData.length - 1] + '.html'

  return targetDir + '/' + [targetUrl, targetFile].join('-')
}

export default pageLoader
