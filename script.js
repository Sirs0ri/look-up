let allEmotes
let filteredEmotes
//#region helpers


function normalizeEmote(raw) {
  const {
    text = "",
    name = "",
    id = "",
    tags = [],
  } = raw

  if (!text || !name) return

  return {
    text: text.toLowerCase(),
    name: name.toLowerCase(),
    id: id.toLowerCase(),
    tags,
  }
}

async function loadEmotes() {
  allEmotes = await fetch("emotes.json")
    .then(d => d.json())
    .then(d => d.map(emote => normalizeEmote(emote)).filter(emote => emote))
    .then(d => d.sort((a, b) => a.name.localeCompare(b.name)))
  filterEmotes()
}

const debounce_duration = 200
let debounce

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
  btn.addEventListener("click", onBtnClick)
  btn.textContent = "📋"

  label.appendChild(nameEl)
  label.appendChild(input)
  label.appendChild(btn)
  wrapper.appendChild(label)
  return wrapper
}

async function onBtnClick(evt) {
  const success = await copyTextToClipboard(evt.target.parentElement.dataset.emote)
  if (success) {
    evt.target.classList.add("success")
    setTimeout(() => {
      evt.target.classList.remove("success")
    }, 1000);
  }
}

function onSearchChange(immediate = false) {
  if (debounce) clearTimeout(debounce)

  if (immediate) filterEmotes()
  else debounce = setTimeout(filterEmotes, debounce_duration)
}

function onSearchClear() {
  search.value = ""
  onSearchChange(true)
}

search.addEventListener("input", () => onSearchChange())
clearSearch.addEventListener("click", onSearchClear)

loadEmotes()



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