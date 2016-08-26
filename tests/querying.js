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
    const expenses = db.select('categories', {where: c => c.type === 'expense'})

    expect(expenses.length).to.be.equal(5)
  })

  it('can query on many2one key', function () {
    const transactions = db.select('transactions', {where: t => t.account === 'bank1'})

    expect(transactions.length).to.be.equal(9)
  })

  it('can preload many2ones', function () {
    const expenses = db.select('transactions', {
      preload: ['category'],
      where: t => t.category.type === 'expense'
    })

    expect(expenses.length).to.be.equal(11)
  })
})
