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
  createTable (name, table_fields) {
    for (let name of Object.keys(table_fields)) {
      const type = table_fields[name].type
      if (!(type in fields)) {
        throw new Error('Unknown field type: ' + name)
      }
    }
    this.tables[name] = {
      fields: table_fields,
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
  query (table, options = {}) {
    let records = this.tables[table].data.slice()

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
    if (options.field) {
      records = records.map(r => r[options.field])
    }
    if (options.aggregate) {
      return records.reduce(options.aggregate)
    }
    return records
  }
  get (table, id) {
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

