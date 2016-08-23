'use strict'

exports.word = {
  parse (words) {
    return [words[0], words.slice(1)]
  },
  format: v => v,
  validate: (a, b) => true
}

exports.amount = {
  parse (words) {
    const amount = parseInt(words[0].replace('.', ''), 10)
    return [amount, words.slice(1)]
  },
  format: v => v,
  validate: v => typeof v === 'number'
}

exports.string = {
  parse (words) {
    return [words.join(' '), []]
  },
  format: v => v,
  validate: _ => true
}

exports.selection = {
  parse (words) {
    return [words[0], words.slice(1)]
  },
  format: v => v,
  validate (value, field) {
    return field.choices.includes(value)
  }
}

exports.date = {
  parse (words) {
    const [day, month, year] = words[0].split('/').map(s => parseInt(s, 10))
    return [new Date(year, month - 1, day), words.slice(1)]
  },
  format (date) {
    const day = (date.getDate() < 10 ? '0' : '') + date.getDate()
    const month = (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1)
    const year = '' + date.getFullYear()
    return day + '/' + month + '/' + year
  },
  validate: _ => true
}

exports.many2one = {
  parse (words) {
    return [words[0], words.slice(1)]
  },
  format: v => v,
  validate (value, field, tables) {
    return tables[field.comodel].data.find(r => r.id === value)
  }
}
