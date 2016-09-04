import fs = require('fs')

import {basicFields} from './fields'
import MemoryDB from './memory_db'
import {FieldDescription, Record} from './memory_db'

let nextId = 1

interface Schema {
    fileExtension: string
    tables: {name: string, fields: any[]}[]
}

interface TextDBConfig {
    path? : string
    activeLog?: boolean
}

export default class TextDB extends MemoryDB {
    private schema: Schema
    private path: string
    private activeLog: boolean
    constructor(options : TextDBConfig) {
        super()
        if (!options.path) {
            return
        }
        this.path = options.path
        const raw_schema = fs.readFileSync(options.path + '/__schema__.json', { encoding: 'utf8' })
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
        this.activeLog = options.activeLog
    }
    private loadTables(tables: any[]) : void {
        for (let table of tables) {
            let fields : {[n: string]: FieldDescription} = {}
            for (let f of table.fields) {
                fields[f.name] = f
            }
            this.createTable(table.name, fields)
        }
    }
    private loadRecords(tables: any[]) : void {
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
    private parseDataLine(line: string, fieldDescrs: any[]) : Record {
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
    insert(name : string, data: Record) : string | number {
        const result = super.insert(name, data)
        if (this.activeLog && this.path) {
            const txt = 'insert,' + name + ',' + JSON.stringify(data)
            this.log(txt)
        }
        return result
    }
    update(tableName: string, id: string | number, changes: {[key: string]: any}) {
        super.update(tableName, id, changes)
        if (this.activeLog && this.path) {
            const txt = 'update,' + tableName + ',' + id + ',' + JSON.stringify(changes)
            this.log(txt)
        }
    }
    delete(table: string, id: string | number) {
        super.delete(table, id)
        if (this.activeLog && this.path) {
            const txt = 'delete,' + table + ',' + id
            this.log(txt)
        }
    }
    private log(txt: string) {
        const date = new Date()
        const timestamp = '[' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + ']'
        const logTxt = timestamp + ' ' + txt  + '\n'
        fs.appendFile(this.path + '/__log__.txt', logTxt)
    }

}
