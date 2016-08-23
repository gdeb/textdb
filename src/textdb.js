'use strict'

const fields = require('./fields')

let nextId = 1

class TextDB {
  constructor () {
    this.tables = Object.create(null)
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
}

module.exports = TextDB

// 'use strict'

// const helpers = require('./helpers')
// let nextId = 1

// module.exports =
//   class DB {
//     constructor (rawData, tables, validators) {
//       this.data = {}
//       // parsing data
//       for (let i = 0; i < tables.length; i++) {
//         this.data[tables[i]] = this.parseFile(rawData[i])
//       }
//       // connecting many2ones
//       for (let table of tables) {
//         let model = this.data[table]
//         for (let record_id of Object.keys(model.data)) {
//           let record = model.data[record_id]
//           for (let n of Object.keys(model.fields)) {
//             let field = model.fields[n]
//             if (field.type === 'many2one') {
//               let value = this.data[field.comodel].data[record[n]]
//               if (!value) {
//                 throw new Error('invalid value for many2one ' + field.name + ': ', record)
//               }
//               record[n] = value
//             }
//           }
//         }
//       }

//       // validating constraints
//       // to do

//       // switching data from object to list
//       for (let model of tables) {
//         let dataObject = this.data[model].data
//         this.data[model].data = []
//         for (let id of Object.keys(dataObject)) {
//           this.data[model].data.push(dataObject[id])
//         }
//       }
//     }
//     get (model) {
//       return this.data[model].data
//     }
//     parseDataLine (str, fields) {
//       let result = {}
//       let words = str.split(/\s+/)
//       for (let field_name of Object.keys(fields)) {
//         let field = fields[field_name]
//         if (field.type === 'word') {
//           result[field.name] = words[0]
//           words = words.slice(1)
//         }
//         if (field.type === 'amount') {
//           result[field.name] = helpers.parseAmount(words[0])
//           words = words.slice(1)
//         }
//         if (field.type === 'string') {
//           result[field.name] = words.join(' ')
//         }
//         if (field.type === 'selection') {
//           if (field.choices.split(',').indexOf(words[0]) > -1) {
//             result[field.name] = words[0]
//             words = words.slice(1)
//           } else {
//             throw new Error('invalid choice')
//           }
//         }
//         if (field.type === 'many2one') {
//           result[field.name] = words[0]
//           words = words.slice(1)
//         }
//         if (field.type === 'date') {
//           result[field.name] = helpers.parseDate(words[0])
//           words = words.slice(1)
//         }
//       }
//       if (!('id' in result)) {
//         result.id = nextId
//         nextId++
//       }
//       return result
//     }
//     parseFieldLine (str) {
//       const words = str.split(/\s+/)
//       const result = {
//         name: words[0],
//         type: words[1]
//       }
//       for (let w of words.slice(2)) {
//         const parts = w.split(':')
//         result[parts[0]] = parts[1]
//       }
//       return result
//     }
//     parseFile (str) {
//       const fields = {}
//       const data = {}
//       const lines = str.split('\n')
//       let currentSection = null
//       for (let line of lines) {
//         if (line.trim() === '') continue
//         if (line[0] === '[' && line[line.length - 1] === ']') {
//           currentSection = line.slice(1, -1)
//           continue
//         }
//         if (currentSection === 'fields') {
//           const field = this.parseFieldLine(line)
//           fields[field.name] = field
//         }
//         if (currentSection === 'data') {
//           const record = this.parseDataLine(line, fields)
//           data[record.id] = record
//         }
//       }
//       return {
//         fields: fields,
//         data: data
//       }
//     }
// }

// // 'use strict'

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
