/* global describe, it, beforeEach */
'use strict'

const expect = require('chai').expect
const TextDB = require('../src/textdb')

let db

beforeEach(function () {
  db = new TextDB({path: __dirname + '/../example'})
})

describe('querying', function () {
  it('can retrieve data with a basic filter', function () {
    const expenses = db.query('categories', {where: c => c.type === 'expense'})

    expect(expenses.length).to.be.equal(5)
  })

  it('can query on many2one key', function () {
    const transactions = db.query('transactions', {where: t => t.account === 'bank1'})

    expect(transactions.length).to.be.equal(9)
  })

  it('can preload many2ones', function () {
    const expenses = db.query('transactions', {
      preload: ['category'],
      where: t => t.category.type === 'expense'
    })

    expect(expenses.length).to.be.equal(11)
  })

  it('can map values on a specific field', function () {
    const balance = db.query('accounts', {where: t => t.id === 'saving', map: t => t.balance})

    expect(balance).to.deep.equal([14004661])
  })

  it('can aggregate values', function () {
    const expenses = -db.query('transactions', {
      preload: ['category'],
      where: t => t.category.type === 'expense',
      map: t => t.amount,
      aggregate: (a, b) => a + b
    })

    expect(expenses).to.be.equal(39474)
  })
})
