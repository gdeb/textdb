/* global describe, it, beforeEach */
'use strict'

const expect = require('chai').expect
const TextDB = require('../src/textdb')

let db

function addTables (db) {
  db.createTable('accounts', {
    id: {type: 'word'},
    initialBalance: {type: 'amount'},
    description: {type: 'string'}
  })

  db.createTable('categories', {
    id: {type: 'word'},
    type: {type: 'selection', choices: ['income', 'expense']},
    description: {type: 'string'}
  })

  db.createTable('transactions', {
    date: {type: 'date'},
    account: {type: 'many2one', comodel: 'accounts'},
    amount: {type: 'amount'},
    category: {type: 'many2one', comodel: 'categories'}
  })
}

function addDemoData (db) {
  db.insert('accounts', {id: 'ing', initialBalance: 40424, description: 'hello world'})
  db.insert('accounts', 'bnp 1042.31 hello world')

  db.insert('categories', {id: 'salaire', type: 'income', description: 'mon salaire'})
  db.insert('categories', {id: 'courses', type: 'expense', description: 'courses courantes'})
  db.insert('categories', {id: 'maison_eau', type: 'expense', description: 'Eau blip blip'})

  db.insert('transactions', {
    date: new Date(2016, 10, 29),
    account: 'ing',
    amount: -7743,
    category: 'courses'
  })
  db.insert('transactions', {
    date: new Date(2016, 1, 19),
    account: 'bnp',
    amount: -6514,
    category: 'courses'
  })
  db.insert('transactions', {
    date: new Date(2016, 1, 19),
    account: 'ing',
    amount: -11743,
    category: 'maison_eau'
  })
  db.insert('transactions', {
    date: new Date(2016, 1, 19),
    account: 'ing',
    amount: 211173,
    category: 'salaire'
  })
}

beforeEach(function () {
  db = new TextDB()
})

describe('basic db operations', function () {
  beforeEach(function () {
    addTables(db)
  })

  it('empty table should have no elements', function () {
    const accounts = db.select('accounts')

    expect(accounts.length).to.be.equal(0)
  })

  it('wrong table name is not accepted', function () {
    expect(_ => db.select('wrong')).to.throw()
  })

  it('cannot insert in non existing table', function () {
    expect(_ => db.insert('wrong', {id: 'ing'})).to.throw()
  })

  it('can insert and query data', function () {
    db.insert('accounts', {id: 'ing', initialBalance: 40424, description: 'hello world'})
    db.insert('accounts', 'bnp 1042.31 hello world')
    const accounts = db.select('accounts')

    expect(accounts.length).to.be.equal(2)
  })

  it('can read data with id', function () {
    const id = db.insert('accounts', {id: 'abc', initialBalance: 17, description: 'yo'})
    expect(id).to.be.equal('abc')
    const account = db.read('accounts', id)
    expect(account.initialBalance).to.be.equal(17)
  })

  it('cannot insert record with missing field', function () {
    expect(_ => db.insert('accounts', {id: 'aaa'})).to.throw()
  })

  it('cannot modify a record from the outside', function () {
    const id = db.insert('accounts', {id: 'abc', initialBalance: 17, description: 'yo'})
    const account = db.read('accounts', id)
    expect(account.initialBalance).to.be.equal(17)
    account.initialBalance = 18
    const account2 = db.read('accounts', id)
    expect(account2.initialBalance).to.be.equal(17)
  })
})

describe('querying', function () {
  beforeEach(function () {
    addTables(db)
    addDemoData(db)
  })

  it('can retrieve data with a basic filter', function () {
    const expenses = db.select('categories', {where: c => c.type === 'expense'})

    expect(expenses.length).to.be.equal(2)
  })

  it('can query on many2one key', function () {
    const transactions = db.select('transactions', {where: t => t.account === 'ing'})

    expect(transactions.length).to.be.equal(3)
  })

  it('can preload many2ones', function () {
    const expenses = db.select('transactions', {
      preload: ['category'],
      where: t => t.category.type === 'expense'
    })

    expect(expenses.length).to.be.equal(3)
  })
})

