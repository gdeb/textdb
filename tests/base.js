/* global describe, it, beforeEach */
'use strict'

const expect = require('chai').expect
const TextDB = require('../src/textdb')

let db

describe('basic db operations', function () {
  beforeEach(function () {
    db = new TextDB({path: __dirname + '/../example'})
  })

  it('empty table should have no elements', function () {
    db.createTable('test', { f: {type: 'word'} })
    const accounts = db.query('test')

    expect(accounts.length).to.be.equal(0)
  })

  it('wrong table name is not accepted', function () {
    expect(_ => db.query('wrong')).to.throw()
  })

  it('cannot insert in non existing table', function () {
    expect(_ => db.insert('wrong', {id: 'ing'})).to.throw()
  })

  it('can insert and query data', function () {
    db.createTable('test', { w: {type: 'word'} })
    db.insert('test', {w: 'sss'})
    db.insert('test', 'abc')
    const words = db.query('test')

    expect(words.length).to.be.equal(2)
  })

  it('cannot create table with unknown field type', function () {
    expect(_ => db.createTable('test', { w: {type: 'lol'} })).to.throw()
  })

  it('can get data with id', function () {
    db.createTable('test', {id: {type: 'word'}, f: {type: 'string'}})
    const id = db.insert('test', {id: 'abc', f: 'this is a string'})
    expect(id).to.be.equal('abc')
    const obj = db.get('test', id)
    expect(obj.f).to.be.equal('this is a string')
  })

  it('cannot insert record with missing field', function () {
    db.createTable('test', {id: {type: 'word'}, f: {type: 'string'}})
    expect(_ => db.insert('test', {id: 'aaa'})).to.throw()
  })

  it('cannot modify a record from the outside', function () {
    db.createTable('test', {id: {type: 'word'}, f: {type: 'string'}})
    const id = db.insert('test', {id: 'abc', f: 'this is a string'})
    const obj = db.get('test', id)
    expect(obj.f).to.be.equal('this is a string')
    obj.str = 'modified string'
    const obj2 = db.get('test', id)
    expect(obj2.f).to.be.equal('this is a string')
  })

  it('cannot insert a record with same id as existing record', function () {
    db.createTable('test', {id: {type: 'word'}, f: {type: 'string'}})
    db.insert('test', {id: 'abc', f: 'this is a string'})
    expect(_ => db.insert('test', {id: 'abc', f: 'another string'})).to.throw()
  })

  it('can limit number of results', function () {
    const transactions = db.query('transactions', {limit: 4})
    expect(transactions.length).to.be.equal(4)
  })
})
