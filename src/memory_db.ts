
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
    preload? : string[]
    limit? : number
}

export default class MemoryDB {
    private tables: {[key: string]: Table}
    private refs: Map<any, any>

    constructor() {
        this.tables = Object.create(null)
        this.refs = new Map()
    }

    createTable(name: string, fieldDescr: {[n: string]: FieldDescription}) : void {
        if (name in this.tables) {
            throw new Error('Error: table already exists: ' + name)
        }

        for (let fieldName of Object.keys(fieldDescr)) {
            const descr = fieldDescr[fieldName]
            const field = basicFields[descr.type]
            if (!field) {
                throw new Error('Invalid field type: ' + descr.type)
            }
        }
        this.tables[name] = {
            fields: fieldDescr,
            data: Object.create(null),
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
        for (let fieldName of Object.keys(table.fields)) {
            const fieldValue = data[fieldName]
            if (fieldName in data) {
                record[fieldName] = fieldValue
            } else {
                throw new Error('Missing field: ' + fieldName)
            }
            const field = table.fields[fieldName]
            if (field.type === 'many2one') {
                const otherTable = this.tables[field['comodel']]
                if (!(fieldValue in otherTable.data)) {
                    throw new Error('Field many2one with wrong key: ' + fieldName)
                } else {
                    const otherRecord = otherTable.data[fieldValue]
                    if (this.refs.has(otherRecord)) {
                        this.refs.get(otherRecord).add(record)
                    } else {
                        const refs = new Set()
                        refs.add(record)
                        this.refs.set(otherRecord, refs)
                    }
                }
            }
            if (field.type === 'selection') {
                if (!field['choices'].includes(fieldValue)) {
                    throw new Error('Invalid value for selection field: ' + fieldValue)
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
            const record = Object.assign({id: id}, table.data[id])
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
        return Object.assign({id: id}, table.data[id])
    }
    update() {

    }
    delete(table: string, id: string | number) {
        const record = this.tables[table].data[id]
        if (this.refs.has(record)) {
            throw new Error('cannot delete record, other records references it: ' + id)
        }
        // remove the record from other records refs
        const fields = this.tables[table].fields
        for (let fieldName of Object.keys(fields)) {
            let fieldDescr = fields[fieldName]
            if (fieldDescr.type === 'many2one') {
                const otherTable = this.tables[fieldDescr['comodel']]
                const otherRecord = otherTable.data[record[fieldName]]
                const refs = this.refs.get(otherRecord)
                refs.delete(record)
                if (refs.size === 0) {
                    this.refs.delete(otherRecord)
                }
            }
        }
        delete this.tables[table].data[id]
    }
}

