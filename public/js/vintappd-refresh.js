document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('.refresh-rating')
  for (const button of buttons) {
    button.addEventListener('click', async function (event) {
      event.preventDefault()
      const vpcode = button.dataset.vpcode
      button.classList.add('loading')
      await fetch(`https://vintappd.jonpacker.com/vp/${vpcode}/refresh`, { method: 'POST' })
      document.location = document.location + '?clean=1'
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
      await fetch(`https://vintappd.jonpacker.com/vp/autolink/${vpcode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prompt ? {
          prompt
        } : {})
      })
      document.location = document.location + '?clean=1'
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
