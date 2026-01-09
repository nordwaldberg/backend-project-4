import path from 'path'
import axios from 'axios'
import fs from 'fs/promises'

const getResourceFilename = (resourceUrl) => {
  const urlData = resourceUrl.split('/').slice(2)
  const rawName = urlData.join('-')

  return rawName.replace(/\.(?=.*\.)/g, '-')
}

const downloadResource = (elem, attr, resourceUrl, resourcesDir, $) => {
  const filename = getResourceFilename(resourceUrl)
  const filepath = path.join(resourcesDir, filename)

  return axios
    .get(resourceUrl, { responseType: 'arraybuffer' })
    .then(({ data }) => fs.writeFile(filepath, data))
    .then(() => {
      $(elem).attr(attr, path.join(path.basename(resourcesDir), filename))
    })
}

export {
  downloadResource,
  getResourceFilename,
}
