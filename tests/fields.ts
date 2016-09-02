/* global describe, it, beforeEach */

const expect = require('chai').expect
import TextDB from '../src/text_db'

let db: TextDB

beforeEach(function () {
    db = new TextDB(__dirname + '/../../example')
})

describe('various fields properties', function () {
    it('throws if inserting record with wrong many2one id', function () {
        const record = {
            id: 11111,
            date: new Date(),
            account: "bank144",
            amount: -111,
            category: "groceries",
            description: "some stuff"
        }
        expect(_ => db.insert('transactions', record)).to.throw()
    })
})
