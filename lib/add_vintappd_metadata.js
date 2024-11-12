const fetch = require('node-fetch')
const redis = require('./redis')()
const md5 = require('md5')
exports.autolinkItemsInDiff = async (diff) => {
  const adds = diff.filter(({op}) => op == 'add')
  
  for (const { value } of adds) {
    const response = await fetch(`https://vintappd.jonpacker.com/vp/autolink/${value.code}`, {
      method: 'POST'
    })
    const link = await response.json()
    if (link.error || !link.beer) continue
    if (typeof link.beer === 'string') link.beer = JSON.parse(link.beer)
    value.bid = link.beer.bid
    value.rating = link.beer.rating_score
    value.ratingCount = link.beer.stats?.total_count || link.beer.rating_count || 0
    value.untappdLink = `https://untappd.com/b/_/${link.beer.bid}`
  }
}

exports.applyVintappdToProductList = async (products, ignoreCache, fullData) => {
  const codes = Object.keys(products)
  const codesQuery = JSON.stringify({ ids: codes })
  const hash = md5(codesQuery)

  let beers = !ignoreCache ? await redis.getAsync(hash) : null

  if (beers) {
    beers = JSON.parse(beers)
  } else {
    const response = await fetch(`https://vintappd.jonpacker.com/vp/getBatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: codes })
    })
    beers = await response.json()
    await redis.setexAsync(hash, 59 * 60, JSON.stringify(beers))
  }

  for (const code of Object.keys(products)) {
    const match = beers[code]
    if (!match) continue
    products[code].bid = match.bid
    products[code].rating = match.rating_score
    products[code].ratingCount = match.stats?.total_count || match.rating_count ||  0
    products[code].style = match.beer_style
    products[code].untappdBrewery = match.brewery.brewery_name
    products[code].untappdName = match.beer_name
    products[code].abv = match.beer_abv
  }

  return products
}

exports.applyVintappdToDiffs = async (diffs) => {
  const beerIds = diffs.reduce((ids, diff) => {
    for (const row of diff.added) {
      if (!row.value.bid && ids.indexOf(row.value.code) === -1) ids.push(row.value.code)
    }
    return ids
  }, [])
  const response = await fetch(`https://vintappd.jonpacker.com/vp/getBatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: beerIds })
  })
  const beers = await response.json()

  return diffs.map(diff => {
    return {
      ...diff,
      added: diff.added.map(row => {
        const matchedBeer = beers[row.value.code]
        if (!matchedBeer) return row
        return {
          ...row,
          value: {
            ...row.value,
            bid: matchedBeer.bid,
            rating: matchedBeer.rating_score,
            ratingCount: match.stats?.total_count || match.rating_count ||  0,
            untappdLink: `https://untappd.com/b/_/${matchedBeer.bid}`
          }
        }
      })
    }
  })
}
