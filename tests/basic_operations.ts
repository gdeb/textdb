/* global describe, it, beforeEach */

const expect = require('chai').expect
import MemoryDB from '../src/memory_db'
import TextDB from '../src/text_db'

let db: MemoryDB


describe('basic operations', function () {
    beforeEach(function () {
        db = new MemoryDB()
    })

    it('can create a table', function () {
        expect(_ => db.createTable('tests', {
            id: {type: 'integer'},
            name: {type: 'string'},
        })).to.not.throw()
    })

    it('throws if querying a non existing table', function () {
        expect(_ => db.query('tests')).to.throw()
    })

    it('throws if inserting in a non existing table', function () {
        expect(_ => db.insert('tests', {id: 1})).to.throw()
    })

    it('throws if creating an already existing table', function () {
        const createFN = _ => db.createTable('tests', {id: {type: 'integer'}})
        expect(createFN).to.not.throw()
        expect(createFN).to.throw()
    })

    it('empty tables have 0 elements', function () {
        db.createTable('tests', {
            id: {type: 'integer'},
        })
        expect(db.query('tests').length).to.be.equal(0)
    })

    it('can insert and query a table', function () {
        db.createTable('tests', {
            id: {type: 'integer'},
            name: {type: 'string'},
        })

        db.insert('tests', {
            id: 5,
            name: 'hello'
        })

        expect(db.query('tests').length).to.be.equal(1)
    })

    it('cannot create table with unknown field type', function () {
        expect(_ => db.createTable('test', { w: {type: 'lol'} })).to.throw()
    })

    it('can get data with id', function () {
        db.createTable('test', {id: {type: 'string'}, f: {type: 'string'}})
        const id = db.insert('test', {id: 'abc', f: 'this is a string'})
        expect(id).to.be.equal('abc')
        const obj = db.get('test', id)
        expect(obj['f']).to.be.equal('this is a string')
    })

    it('get null if trying to get non existing record', function () {
        db.createTable('test', {id: {type: 'string'}, f: {type: 'string'}})
        const obj = db.get('test', 'nope')
        expect(obj).to.be.equal(null)
    })

    it('cannot insert record with missing field', function () {
        db.createTable('test', {id: {type: 'string'}, f: {type: 'string'}})
        expect(_ => db.insert('test', {id: 'aaa'})).to.throw()
    })

    it('cannot modify a record from the outside', function () {
        db.createTable('test', {id: {type: 'word'}, f: {type: 'string'}})
        const id = db.insert('test', {id: 'abc', f: 'this is a string'})
        const obj = db.get('test', id)
        expect(obj['f']).to.be.equal('this is a string')
        obj['f'] = 'modified string'
        const obj2 = db.get('test', id)
        expect(obj2['f']).to.be.equal('this is a string')
    })

    it('throws if inserting record with existing id', function () {
        db.createTable('test', {id: {type: 'word'}, f: {type: 'string'}})
        expect(_ => db.insert('test', {id: 'abc', f: 'this is a string'})).to.not.throw()
        expect(_ => db.insert('test', {id: 'abc', f: 'another string'})).to.throw()
    })

})

describe('basic operations on demo data', function () {
    beforeEach(function () {
        db = new TextDB(__dirname + '/../../example')
    })

    it('create an id if no id is in the list of fields', function () {
        const [t] = db.query('transactions', {limit: 1})
        expect(t.id).to.be.a('string')
    })

    it('can delete records', function () {
        const [t] = db.query('transactions', {limit: 1})
        db.delete('transactions', t.id)
        const transaction = db.get('transactions', t.id)
        expect(transaction).to.be.equal(null)
    })

    it('will not delete if many2one is invalidated', function () {
        const account = db.get('accounts', 'bank1')
        expect(_ => db.delete('accounts', account['id'])).to.throw()
    })

    it('can delete if related records are deleted as well', function () {
        expect(_ => db.delete('categories', 'water')).to.throw()
        const [t] = db.query('transactions', {
            where: t => t['category'] === 'water',
            limit: 1
        })
        db.delete('transactions', t.id)
        expect(_ => db.delete('categories', 'water')).to.not.throw()
    })

    it('can update a record', function () {
        db.update('accounts', 'visa', {balance: 42})
        const visaAccount = db.get('accounts', 'visa')
        expect(visaAccount['balance']).to.be.equal(42)
    })
})
