const fetch = require('node-fetch')
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
    value.ratingCount = link.beer.rating_count
    value.untappdLink = `https://untappd.com/b/_/${link.beer.bid}`
  }
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
            ratingCount: matchedBeer.rating_count,
            untappdLink: `https://untappd.com/b/_/${matchedBeer.bid}`
          }
        }
      })
    }
  })
}
