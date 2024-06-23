let allEmotes
let allTags
let previousVotes
let allVotes


//#region session data loading

function loadPreviousVotes() {
  const votes = localStorage.getItem("votes")
  console.log('votes:', votes)
  if (votes) {
    previousVotes = JSON.parse(votes)
  } else {
    previousVotes = {}
  }

  allVotes = { ...previousVotes }
}

loadPreviousVotes()
//#endregion

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

async function loadTags() {
  allTags = await fetch("emotes.schema.json")
    .then(d => d.text())
    .then(d => JSON5.parse(d))
    .then(d => d.patternProperties["..."].properties.tags.items.enum)

  updateTagOptions()
}

async function loadEmotes() {
  allEmotes = await fetch("emotes.json")
    .then(d => d.json())
    .then(d => Object.entries(d)
      .map(([id, emote]) => normalizeEmote({ ...emote, id }))
      .filter(emote => emote)
      .sort((a, b) => a.name.localeCompare(b.name))
    )
  updateEmoteList()
  updateTagOptions()
}

async function updateTagOptions() {
  if (!allTags) return

  while (search.children.length) {
    search.removeChild(search.firstChild)
  }

  for (const tag of allTags) {
    const el = makeTagElement(tag)
    search.appendChild(el)
  }
}

function makeTagElement(tag) {
  const wrapper = document.createElement("option")
  wrapper.value = tag
  wrapper.textContent = tag

  const votesForTag = allVotes ? Object.values(allVotes).filter(v => v[tag] != null).length : 0
  const tagCount = allEmotes ? allEmotes.length : 0

  // wrapper.dataset.votesCount = votesForTag
  // wrapper.dataset.emoteCount = tagCount

  const progressHint = document.createElement("span")
  progressHint.textContent = ` (${votesForTag} / ${tagCount})`
  progressHint.classList.add("progress-hint")
  wrapper.appendChild(progressHint)
  return wrapper
}

search.addEventListener("change", () => updateEmoteList())

function updateEmoteList() {
  if (!allEmotes) return

  while (emojicons.children.length) {
    emojicons.removeChild(emojicons.firstChild)
  }

  if (!allEmotes.length) {
    emojicons.dataset.emptyMessage = "No match found"
  }

  for (const emote of allEmotes) {
    const el = makeEmoteElement(emote)
    emojicons.insertBefore(el, emojicons.firstChild)
  }
}

function makeEmoteElement(emote) {
  const wrapper = document.createElement("li")
  wrapper.classList.add("emote-wrapper-voting")
  wrapper.dataset.emote = emote.id

  const tag = search.value || allTags?.[0] || ""

  const vote = allVotes[emote.id]?.[tag]
  if (vote != null) wrapper.classList.add("voted")

  const name = document.createElement("p")
  name.classList.add("emote-name")
  name.innerText = emote.name

  const emoteDisplay = document.createElement("p")
  emoteDisplay.classList.add("emote-display")
  emoteDisplay.innerText = emote.text

  const btnYes = document.createElement("button")
  btnYes.classList.add("yes")
  btnYes.innerHTML = `✅<span class="visually-hidden">"${emote.name}" matches</span>`
  btnYes.addEventListener("click", onVoteBtnClick)

  const btnNo = document.createElement("button")
  btnNo.classList.add("no")
  btnNo.innerHTML = `❌<span class="visually-hidden">"${emote.name}" matches</span>`
  btnNo.addEventListener("click", onVoteBtnClick)

  wrapper.appendChild(name)
  wrapper.appendChild(emoteDisplay)
  wrapper.appendChild(btnYes)
  wrapper.appendChild(btnNo)
  return wrapper
}

function onVoteBtnClick(evt) {
  const tag = search.value
  const isYesVote = evt.target.classList.contains("yes")
  const emoteId = evt.target.parentElement.dataset.emote

  evt.target.parentElement.classList.add("voted")

  registerVote(emoteId, isYesVote)
}

function registerVote(emoteId, value) {
  if (!allVotes[emoteId]) allVotes[emoteId] = {}

  const tag = search.value

  allVotes[emoteId][tag] = value
}

function onUndoClick() {
  const lastVote = document.querySelector("li.voted")
  if (!lastVote) return
  lastVote.classList.remove("voted")
  const tag = search.value
  const emote = lastVote.dataset.emote
  registerVote(lastVote.dataset.emote, undefined)
}

undo.addEventListener("click", () => onUndoClick())

function saveData(evt, exportToFile = false) {
  for (const key in allVotes) {
    if (Object.hasOwnProperty.call(allVotes, key)) {
      const emoteIndex = allEmotes.findIndex(e => e.id === key)
      const emote = allEmotes[emoteIndex]
      const current = emote.tags
      const incomingVotes = Object.entries(allVotes[key])

      const incomingDeletions = incomingVotes.filter(([k, v]) => !v).map(([k, v]) => k)
      const incomingAdditions = incomingVotes.filter(([k, v]) => v).map(([k, v]) => k)

      let newTags = current.filter(tag => !incomingDeletions.includes(tag))
      newTags.push(...incomingAdditions)
      newTags = [...new Set(newTags)]

      allEmotes[emoteIndex].tags = newTags
    }
  }

  const votesJson = JSON.stringify(allVotes, null, 2)
  localStorage.setItem("votes", votesJson)

  evt.target.classList.add("success")
  setTimeout(() => {
    evt.target.classList.remove("success")
  }, 1000);

  updateTagOptions()

  if (!exportToFile) return

  const emotesJson = JSON.stringify(allEmotes, null, 2)
  const f = new File([emotesJson], "emotes.json", { type: "application/json" })
  const url = URL.createObjectURL(f)

  const downloadLink = document.createElement("a")
  downloadLink.href = url
  downloadLink.download = `emotes-${Date.now()}.json`
  downloadLink.click()
  URL.revokeObjectURL(url)
}

saveCategories.addEventListener("click", (evt) => saveData(evt))
saveAndExportCategories.addEventListener("click", (evt) => saveData(evt, true))

// Finally, when everything's loaded, load and display the emotes
loadTags()
loadEmotes()
