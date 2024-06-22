let allEmotes
let filteredEmotes

//#region emote processing

function normalizeEmote(raw) {
  const {
    text = "",
    name = "",
    id = "",
    tags = [],
  } = raw

  if (!text || !name) return

  return {
    text: text,
    name: name.toLowerCase(),
    id: id.toLowerCase(),
    tags,
  }
}

async function loadEmotes() {
  allEmotes = await fetch("emotes.json")
    .then(d => d.json())
    .then(d => Object.entries(d)
      .map(([id, emote]) => normalizeEmote({ ...emote, id }))
      .filter(emote => emote)
      .sort((a, b) => a.name.localeCompare(b.name))
    )
  filterEmotes()
}

const filterDebounceDuration = 200
let filterDebounce

function filterEmotes() {
  const filter = search.value.toLowerCase()
  filteredEmotes = allEmotes.filter(e => e.name.includes(filter))

  updateEmoteList()
}

function updateEmoteList() {
  console.log(filteredEmotes.length)

  if (!allEmotes) return

  while (emojicons.children.length) {
    emojicons.removeChild(emojicons.firstChild)
  }

  if (!filterEmotes.length) {
    emojicons.dataset.emptyMessage = "No match found"
  }

  for (const emote of filteredEmotes) {
    const el = makeEmoteElement(emote)
    emojicons.appendChild(el)
  }
}

function makeEmoteElement(emote) {
  const wrapper = document.createElement("li")
  const label = document.createElement("label")
  label.dataset.emote = emote.text
  const nameEl = document.createElement("p")
  nameEl.innerText = emote.name

  const input = document.createElement("input")
  input.value = emote.text
  input.addEventListener("focus", evt => evt.target.select())

  const btn = document.createElement("button")
  btn.addEventListener("click", onCopyBtnClick)
  btn.textContent = "📋"

  label.appendChild(nameEl)
  label.appendChild(input)
  label.appendChild(btn)
  wrapper.appendChild(label)
  return wrapper
}

//#endregion

//#region event handlers

async function onCopyBtnClick(evt) {
  const success = await copyTextToClipboard(evt.target.parentElement.dataset.emote)
  if (success) {
    evt.target.classList.add("success")
    setTimeout(() => {
      evt.target.classList.remove("success")
    }, 1000);
  }
}

function onSearchInput(immediate = false) {
  if (filterDebounce) clearTimeout(filterDebounce)

  if (immediate) filterEmotes()
  else filterDebounce = setTimeout(filterEmotes, filterDebounceDuration)
}

search.addEventListener("input", () => onSearchInput())

function onSearchClear() {
  search.value = ""
  onSearchInput(true)
}

clearSearch.addEventListener("click", () => onSearchClear())

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea")
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = "0"
  textArea.style.left = "0"
  textArea.style.position = "fixed"

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  let success = false

  try {
    success = document.execCommand('copy')
    const msg = success ? 'successful' : 'unsuccessful'
  } catch (err) {
    console.error('Fallback: Unable to copy:', err)
    setError("Failed to set clipboard")
  }

  document.body.removeChild(textArea)

  return success
}
async function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    return fallbackCopyTextToClipboard(text)
  }
  return navigator.clipboard.writeText(text).then(
    () => true,
    err => {
      console.error('Async: Could not copy text: ', err)
      setError("Failed to set clipboard")
      return false
    })
}

function setError(msg) {
  error.textContent = msg

  if (msg) error.parentElement.classList.remove("hidden")
  else error.parentElement.classList.add("hidden")


}

clearError.addEventListener("click", () => setError(''))

//#endregion

// Finally, when everything's loaded, load and display the emotes
loadEmotes()