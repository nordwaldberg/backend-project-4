#!/usr/bin/env node

import { program } from 'commander'
import pageLoader from '../index.js'
import fs from 'fs/promises'

program
  .name('page-loader')
  .description('Page loader utility.')
  .version('1.0.0')
  .usage('[options] <url>')

program
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .argument('<url>')
  .action((url, options) => {
    const output = options.output || process.cwd()

    fs.access(output, fs.constants.W_OK)
      .then(() => pageLoader(url, output))
      .then((result) => {
        console.log(result)
        process.exit(0)
      })
      .catch((err) => {
        console.error(err.message)
        process.exit(1)
      })
  })

program.parse()
