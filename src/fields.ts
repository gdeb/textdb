
export interface Field<T> {
    parseToken: 'word' | 'string'
    serialize(value: T, options?: any) : string
    deserialize(str: string, options?: any) : T
}

const FieldString : Field<string> = {
    parseToken: 'string',
    serialize: value => value,
    deserialize: str => str,
}

const FieldWord : Field<string> = {
    parseToken: 'word',
    serialize: value => value,
    deserialize: str => str,
}

const FieldInteger : Field<number> = {
    parseToken: 'word',
    serialize: value => String(value),
    deserialize: str => parseInt(str)
}

const FieldSelection : Field<string> = {
    parseToken: 'word',
    serialize: value => value,
    deserialize: str => str,
}

const FieldDate: Field<Date> = {
    parseToken: 'word',
    serialize: function(date, options) {
        const day = (date.getDate() < 10 ? '0' : '') + date.getDate()
        const month = (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1)
        const year = '' + date.getFullYear()
        if (options.format === 'MM/DD/YYYY') {
            return month + '/' + day + '/' + year
        } else {
            return day + '/' + month + '/' + year
        }
    },
    deserialize: function(str, options) {
        let month, day, year
        let parts = str.split('/').map(s => parseInt(s, 10))
        if (options.format === 'MM/DD/YYYY') {
            month = parts[0]
            day = parts[1]
            year = parts[2]
        } else {
            day = parts[0]
            month = parts[1]
            year = parts[2]
        }
        return new Date(year, month - 1, day)
    }

}

const FieldMany2One: Field<string | number> = {
    parseToken: 'word',
    serialize: value => String(value),
    deserialize: str => str,
}

const FieldAmount : Field<number> = {
    parseToken: 'word',
    serialize: value => String(value),
    deserialize: str => parseInt(str.replace('.', ''), 10)
}

export const basicFields : {[key: string] : Field<any>}= {
    string: FieldString,
    integer: FieldInteger,
    word: FieldWord,
    selection: FieldSelection,
    date: FieldDate,
    many2one: FieldMany2One,
    amount: FieldAmount,
}
