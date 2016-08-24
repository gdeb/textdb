'use strict'

const fs = require('fs')
const fields = require('./fields')

let nextId = 1

class TextDB {
  constructor (options = {}) {
    this.tables = Object.create(null)
    if (options.path) {
      const files = fs.readdirSync(options.path)
      for (let f of files) {
        this._loadTable(options.path, f)
      }
    }
  }
  createTable (name, fields) {
    this.tables[name] = {
      fields: fields,
      data: [],
      dataMap: {}
    }
  }
  insert (tableName, data) {
    const table = this.tables[tableName]
    let record = {}
    if (typeof data === 'string') {
      let words = data.split(/\s+/)
      for (let name of Object.keys(table.fields)) {
        let result = fields[table.fields[name].type].parse(words)
        record[name] = result[0]
        words = result[1]
      }
    } else {
      for (let name of Object.keys(table.fields)) {
        if (name in data) {
          record[name] = data[name]
        } else {
          throw new Error('Missing field: ' + name)
        }
      }
    }
    // validation
    for (let name of Object.keys(table.fields)) {
      if (!fields[table.fields[name].type].validate(record[name], table.fields[name], this.tables)) {
        throw new Error('invalid value for field ' + name + ': ' + record[name])
      }
    }
    if (!('id' in table.fields)) {
      record.id = nextId
      nextId++
    }

    table.data.push(record)
    table.dataMap[record.id] = record
    return record.id
  }
  select (table, options = {}) {
    let records = this.tables[table].data.slice()
    if (options.field) {
      records = records.map(r => r[options.field])
    }

    if (options.preload) {
      for (let fieldName of options.preload) {
        let field = this.tables[table].fields[fieldName]
        for (let r of records) {
          r[fieldName] = this.tables[field.comodel].dataMap[r[fieldName]]
        }
      }
    }
    if (options.where) {
      records = records.filter(options.where)
    }
    return records
  }
  read (table, id) {
    return Object.assign({}, this.tables[table].dataMap[id])
  }

  _loadTable (path, name) {
    const rawData = fs.readFileSync(path + '/' + name, {encoding: 'utf8'})
    const fields = {}
    const records = []
    const lines = rawData.split('\n')
    const tableName = name.split('.')[0]
    let currentSection = null
    for (let line of lines) {
      if (line.trim() === '') continue
      if (line[0] === '[' && line[line.length - 1] === ']') {
        currentSection = line.slice(1, -1)
        continue
      }
      if (currentSection === 'fields') {
        const field = this.parseFieldLine(line)
        const name = field.name
        delete field.name
        fields[name] = field
      }
      if (currentSection === 'data') {
        records.push(line)
      }
    }
    this.createTable(tableName, fields)
    for (let r of records) {
      this.insert(tableName, r)
    }
  }

  parseFieldLine (str) {
    const words = str.split(/\s+/)
    const result = {
      name: words[0],
      type: words[1]
    }
    for (let w of words.slice(2)) {
      const parts = w.split(':')
      result[parts[0]] = parts[1]
    }
    return result
  }
}

module.exports = TextDB



// // const helpers = require('../helpers')

// // function formatValue (record, field) {
// //   if (field.type === 'date') {
// //     return helpers.formatDate(record[field.name])
// //   }
// //   if (field.type === 'amount') {
// //     return helpers.formatAmount(record[field.name], {no_space: true})
// //   }
// //   if (field.type === 'many2one') {
// //     return String(record[field.name].id)
// //   }
// //   return String(record[field.name])
// // }

// // module.exports = function (models, data) {
// //   const result = []
// //   for (let model of models) {
// //     result.push('[' + model.name + ']')

// //     // prepare records in a list
// //     const records = []
// //     for (let id of Object.keys(data[model.name])) {
// //       records.push(data[model.name][id])
// //     }

// //     // compute maximum length
// //     const maxLengths = {}
// //     for (let record of records) {
// //       for (let field of model.fields) {
// //         let value = formatValue(record, field)
// //         maxLengths[field.name] = Math.max(value.length, maxLengths[field.name] || 0)
// //       }
// //     }
// //     // display all elements
// //     for (let record of records) {
// //       let str = ''
// //       for (let field of model.fields) {
// //         let value = formatValue(record, field)
// //         let padFunction = field.type === 'amount' ? helpers.leftPad : helpers.rightPad
// //         str += padFunction(value, maxLengths[field.name], ' ') + '  '
// //       }
// //       result.push(str.trim())
// //     }
// //     result.push('')
// //   }
// //   return result.join('\n')
// // }
