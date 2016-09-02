import fs = require('fs')

import {basicFields} from './fields'
import MemoryDB from './memory_db'
import {FieldDescription, Record} from './memory_db'

let nextId = 1

interface Schema {
    fileExtension: string
    tables: {name: string, fields: any[]}[]
}

export default class TextDB extends MemoryDB {
    private schema: Schema
    private path: string
    constructor(path: string) {
        super()
        this.path = path
        const raw_schema = fs.readFileSync(path + '/__schema__.json', { encoding: 'utf8' })
        this.schema = JSON.parse(raw_schema)
        const tables = this.schema.tables.sort(function(t1, t2) {
            for (let f of t2.fields) {
                if (f.comodel === t1.name) {
                    return -1
                }
            }
            return 1
        })
        this.loadTables(tables)
        this.loadRecords(tables)
    }
    loadTables(tables: any[]) : void {
        for (let table of tables) {
            let fields : {[n: string]: FieldDescription} = {}
            for (let f of table.fields) {
                fields[f.name] = f
            }
            this.createTable(table.name, fields)
        }
    }
    loadRecords(tables: any[]) : void {
        const extension = this.schema.fileExtension
        for (let table of tables) {
            const fileName = this.path + '/' + table.name + '.' + extension
            const data = fs.readFileSync(fileName, {encoding: 'utf8'})
            const lines = data.split('\n')
            for (let line of lines) {
                if (line.trim() === '') continue
                const record = this.parseDataLine(line, table.fields)
                this.insert(table.name, record)
            }
        }
    }
    parseDataLine(line: string, fieldDescrs: any[]) : Record {
        const record : Record = {id: undefined}
        let words = line.split(/\s+/)
        for (let descr of fieldDescrs) {
            let field = basicFields[descr.type]
            if (field.parseToken === 'word') {
                let value = field.deserialize(words[0], descr)
                record[descr.name] = value
                words = words.slice(1)
            }
            if (field.parseToken === 'string') {
                let value = field.deserialize(words.join(' '), descr)
                record[descr.name] = value
                words = []
            }
        }
        if (!record.id) {
            record.id = nextId;
            nextId++
        }
        return record
    }

}




// class TextDB {
//   tables: any
//   constructor (options = {}) {
//     this.tables = Object.create(null)
//     if (options.path) {
//       const files = fs.readdirSync(options.path)
//       for (let f of files) {
//         this._loadTable(options.path, f)
//       }
//     }
//   }
//   createTable (name: string, table_fields) {
//     for (let name of Object.keys(table_fields)) {
//       const type = table_fields[name].type
//       if (!(type in fields)) {
//         throw new Error('Unknown field type: ' + name)
//       }
//     }
//     for (let n of Object.keys(table_fields)) {
//       let field = table_fields[n]
//       if (field.type === 'many2one') {
//         this.tables[field.comodel].many2ones.push({
//           table: name,
//           field: n
//         })
//       }
//     }
//     this.tables[name] = {
//       fields: table_fields,
//       many2ones: [],
//       data: [],
//       dataMap: {}
//     }
//   }
//   insert (tableName, data) {
//     const table = this.tables[tableName]
//     let record = {}
//     if (typeof data === 'string') {
//       let words = data.split(/\s+/)
//       for (let name of Object.keys(table.fields)) {
//         let result = fields[table.fields[name].type].parse(words)
//         record[name] = result[0]
//         words = result[1]
//       }
//     } else {
//       for (let name of Object.keys(table.fields)) {
//         if (name in data) {
//           record[name] = data[name]
//         } else {
//           throw new Error('Missing field: ' + name)
//         }
//       }
//     }
//     // validation
//     for (let name of Object.keys(table.fields)) {
//       if (!fields[table.fields[name].type].validate(record[name], table.fields[name], this.tables)) {
//         throw new Error('invalid value for field ' + name + ': ' + record[name])
//       }
//     }
//     if (!('id' in table.fields)) {
//       record.id = nextId
//       nextId++
//     }

//     if (record.id in table.dataMap) {
//       throw new Error('cannot insert record, id already exists')
//     }
//     table.data.push(record)
//     table.dataMap[record.id] = record
//     return record.id
//   }
//   query (table, options: QueryOptions = {preload: undefined}) {
//     let records = this.tables[table].data.slice()

//     if (options.preload) {
//       for (let fieldName of options.preload) {
//         let field = this.tables[table].fields[fieldName]
//         for (let r of records) {
//           r[fieldName] = this.tables[field.comodel].dataMap[r[fieldName]]
//         }
//       }
//     }
//     if (options.where) {
//       records = records.filter(options.where)
//     }
//     if (options.map) {
//       records = records.map(options.map)
//     }
//     if (options.aggregate) {
//       return records.reduce(options.aggregate)
//     }
//     if (options.limit) {
//       records = records.slice(0, options.limit)
//     }
//     return records
//   }
//   get (table, id) {
//     const record = this.tables[table].dataMap[id]
//     return record ? Object.assign({}, record) : null
//   }

//   delete (table, id) {
//     let t = this.tables[table]
//     for (let m2m of t.many2ones) {
//       if (this.query(m2m.table, {where: r => r[m2m.field] === id, limit: 1}) !== []) {
//         throw new Error('cannot delete record, because other records references it')
//       }
//     }
//     let record = t.dataMap[id]
//     let index = t.data.indexOf(record)
//     t.data.splice(index, 1)
//     delete t.dataMap[id]
//   }
//   private _loadTable (path, name) {
//     const rawData = fs.readFileSync(path + '/' + name, {encoding: 'utf8'})
//     const fields = {}
//     const records = []
//     const lines = rawData.split('\n')
//     const tableName = name.split('.')[0]
//     let currentSection = null
//     for (let line of lines) {
//       if (line.trim() === '') continue
//       if (line[0] === '[' && line[line.length - 1] === ']') {
//         currentSection = line.slice(1, -1)
//         continue
//       }
//       if (currentSection === 'fields') {
//         const field = this.parseFieldLine(line)
//         const name = field.name
//         delete field.name
//         fields[name] = field
//       }
//       if (currentSection === 'data') {
//         records.push(line)
//       }
//     }
//     this.createTable(tableName, fields)
//     for (let r of records) {
//       this.insert(tableName, r)
//     }
//   }

//   parseFieldLine (str: string) {
//     const words = str.split(/\s+/)
//     const result = {
//       name: words[0],
//       type: words[1]
//     }
//     for (let w of words.slice(2)) {
//       const parts = w.split(':')
//       result[parts[0]] = parts[1]
//     }
//     return result
//   }
// }


// // module.exports = TextDB;
// export = TextDB