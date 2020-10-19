const fetch = require('node-fetch')
module.exports = async (diff) => {
  const adds = diff.filter(({op}) => op == 'add')
  
  for (const { value } of adds) {
    const response = await fetch(`https://vintappd.jonpacker.com/vp/autolink/${value.code}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: value.name })
    })
    const link = await response.json()
    if (link.error || !link.beer) continue
    if (typeof link.beer === 'string') link.beer = JSON.parse(link.beer)
    value.bid = link.beer.bid
    value.rating = link.beer.rating_score
    value.ratingCount = link.beer.rating_count
  }
}
