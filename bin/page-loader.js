#!/usr/bin/env node

import { program } from 'commander'
import pageLoader from '../index.js'

program
  .name('page-loader')
  .description('Page loader utility.')
  .version('1.0.0')
  .usage('[options] <url>')

program
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .argument('<url>')
  .action((url, options) => {
    pageLoader(url, options.output || process.cwd()).then(console.log)
  })

program.parse()
