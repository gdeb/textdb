/* global describe, it, beforeEach */
'use strict'

const expect = require('chai').expect
const TextDB = require('../src/textdb')

let db

beforeEach(function () {
  db = new TextDB({path: __dirname + '/../example'})
})

describe('deleting', function () {
  it('can delete records', function () {
    const [t] = db.query('transactions', {limit: 1})
    db.delete('transactions', t.id)
    const transaction = db.get('transactions', t.id)
    expect(transaction).to.be.equal(null)
  })

  it('will not delete if many2one is invalidated', function () {
    const account = db.get('accounts', 'bank1')
    expect(_ => db.delete('accounts', account)).to.throw()
  })
})
