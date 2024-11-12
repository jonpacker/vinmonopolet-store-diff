document.addEventListener('DOMContentLoaded', function () {
  /**
   *
              a.utrating(href=`https://untappd.com/b/_/${product.bid}`)
                if product.rating
                  | #{product.rating}
                  */
  const buttons = document.querySelectorAll('.refresh-rating')
  for (const button of buttons) {
    button.addEventListener('click', async function (event) {
      event.preventDefault()
      const vpcode = button.dataset.vpcode
      button.classList.add('loading')
      const response = await fetch(`https://vintappd.jonpacker.com/vp/${vpcode}/refresh`, { method: 'POST' })
      const updated = await response.json()
      const oldrating = document.querySelector(`.utrating[data-vpcode="${vpcode}"]`)
      oldrating.innerHTML = updated.beer.rating_score || '-'
      button.classList.remove('loading')
      //document.location = document.location + '?clean=1'
    })
  }
  const linkButtons = document.querySelectorAll('.autolink')
  for (const button of linkButtons) {
    button.addEventListener('click', async function (event) {
      event.preventDefault()
      const vpcode = button.dataset.vpcode
      const promptElement = button.previousElementSibling
      const prompt = promptElement.value
      button.classList.add('loading')
      const response = await fetch(`https://vintappd.jonpacker.com/vp/autolink/${vpcode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prompt ? {
          prompt
        } : {})
      })
      const link = await response.json()
      const column = document.querySelector(`.vintappd-col[data-vpcode="${vpcode}"]`)
      column.innerHTML = `
        <a class='utrating' href='https://untappd.com/b/_/${link.beer.bid}'>
          ${link.beer.rating_score}
          ✅
        </a>
      `
    })
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'p') {
      const autolinkContainer = document.querySelectorAll('.autolink-container')
      for (const cont of autolinkContainer) {
        cont.style.display = 'block'
      }
    }
  })
})
