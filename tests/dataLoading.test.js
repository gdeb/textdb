/* global describe, it */
'use strict'

const expect = require('chai').expect
const TextDB = require('../src/textdb')

describe('basic loading operations', function () {
  it('db should load demo data', function () {
    const db = new TextDB({path: __dirname + '/../example'})
    const accounts = db.select('accounts')

    expect(accounts.length).to.be.equal(4)
  })
})
