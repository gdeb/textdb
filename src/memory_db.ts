
import {Field, basicFields} from './fields'

export interface Record {
    id: string | number
    [name: string] : any
}

interface Table {
    fields: {[name: string] : FieldDescription}
    data: {[id: string] : Record}
}



export interface FieldDescription {
    type: string
    options? : any
}

interface QueryOptions {
    where? (r: Record) : boolean
    preload? : string[],
    limit? : number
}

export default class MemoryDB {
    tables: {[key: string]: Table}

    constructor() {
        this.tables = Object.create(null)
    }

    createTable(name: string, fieldDescr: {[n: string]: FieldDescription}) : void {
        if (name in this.tables) {
            throw new Error('Error: table already exists: ' + name)
        }

        const fields : {[name: string] : Field<any> } = {}

        for (let fieldName of Object.keys(fieldDescr)) {
            const descr = fieldDescr[fieldName]
            const field = basicFields[descr.type]
            if (!field) {
                throw new Error('Invalid field type: ' + descr.type)
            }
            fields[fieldName] = field
        }
        this.tables[name] = {
            fields: fieldDescr,
            data: Object.create(null)
        }
    }

    insert(name : string, data: Record) : string | number {
        const table = this.tables[name]
        if (!table) {
            throw new Error('Error: table does not exist: ' + name)
        }
        if (data.id in table.data) {
            throw new Error('Error: id already exists: ' + data.id)
        }
        const record : Record = Object.create(null)
        for (let n of Object.keys(table.fields)) {
            if (n in data) {
                record[n] = data[n]
            } else {
                throw new Error('Missing field: ' + n)
            }
            const field = table.fields[n]
            if (field.type === 'many2one') {
                if (!(data[n] in this.tables[field.comodel].data)) {
                    throw new Error('Field many2one with wrong key: ' + n)
                }
            }
        }
        table.data[data.id] = record
        return record.id
    }

    query(tableName: string, options : QueryOptions = {}) : Record[] {
        const table = this.tables[tableName]
        if (!table) {
            throw new Error('Error: table does not exist: ' + tableName)
        }
        const result = []
        for (let id in table.data) {
            const record = Object.assign({}, table.data[id])
            if (options.preload) {
                for (let fieldName of options.preload) {
                    const field = table.fields[fieldName]
                    const key = record[fieldName]
                    record[fieldName] = this.tables[field['comodel']].data[key]
                }
            }
            if ((!options.where) || (options.where && options.where(record))) {
                result.push(record)
                if (options.limit && result.length === options.limit) {
                    break;
                }
            }
        }
        return result
    }
    get(tableName: string, id: string | number) : Record | void {
        const table = this.tables[tableName]
        if (!table) {
            throw new Error('Error: table does not exist: ' + name)
        }
        if (!(id in table.data)) {
            return null
            // throw new Error('Error: record does not exist')
        }
        return Object.assign({}, table.data[id])
    }
    update() {

    }
    delete() {

    }
}

