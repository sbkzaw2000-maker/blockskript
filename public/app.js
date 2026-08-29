const workspace = document.getElementById("workspace");
const workspaceWrap = document.querySelector(".workspace-wrap");
const codeEl = document.querySelector("#code code");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");
let blocks = [];
let nextId = 1;
let workspaceZoom = 1;
let isPanningWorkspace = false;
let panStartX = 0;
let panStartY = 0;
let panStartShiftX = 0;
let panStartShiftY = 0;
let workspaceShiftX = 0;
let workspaceShiftY = 0;

const definitions = {
  event_join: {
    title: "Kiedy gracz dołącza",
    kind: "event",
    fields: []
  },
  event_death: {
    title: "Kiedy gracz umiera",
    kind: "event",
    fields: []
  },
  event_right_click: {
    title: "Kiedy gracz kliknie prawym przyciskiem",
    kind: "event",
    fields: []
  },
  event_chat: {
    title: "Kiedy gracz napisze na czacie",
    kind: "event",
    fields: []
  },
  if_tool: {
    title: "Jeśli gracz ma przedmiot",
    kind: "condition",
    fields: [
      ["item", "Przedmiot", "diamond"]
    ]
  },
  if_world: {
    title: "Jeśli gracz jest w świecie",
    kind: "condition",
    fields: [
      ["world", "Świat", "world"]
    ]
  },
  if_message_contains: {
    title: "Jeśli wiadomość zawiera",
    kind: "condition",
    fields: [["text", "Szukany tekst", ""]]
  },
  if_permission: {
    title: "Jeśli gracz ma permisję",
    kind: "condition",
    fields: [["permission", "Permisja", "plugin.admin"]]
  },
  if_loop_permission: {
    title: "Jeśli gracz w pętli ma permisję",
    kind: "condition",
    fields: [["permission", "Permisja", "plugin.admin"]]
  },
  send_message: {
    title: "Wyślij wiadomość",
    kind: "action",
    fields: [
      ["message", "Wiadomość", "&aWitaj!"]
    ]
  },
  send_loop_message: {
    title: "Wyślij wiadomość do gracza w pętli",
    kind: "action",
    fields: [["message", "Wiadomość", "Wiadomość"]]
  },
    send_permission_message: {
      title: "Wyślij wiadomość do gracza z permisją",
      kind: "action",
      fields: [
        ["permission", "Permisja", "plugin.admin"],
        ["message", "Wiadomość", "Wiadomość"]
      ]
    },
  cancel_event: {
    title: "Anuluj zdarzenie",
    kind: "action",
    fields: []
  },
  loop_players: {
    title: "Wykonaj dla każdego gracza",
    kind: "other",
    fields: []
  },
  give_item: {
    title: "Daj przedmiot",
    kind: "action",
    fields: [
      ["item", "Przedmiot", "diamond"],
      ["amount", "Ilość", "1"]
    ]
  },
  money: {
    title: "Dodaj pieniądze",
    kind: "action",
    fields: [
      ["amount", "Kwota", "10"]
    ]
  },
  remove_money: {
    title: "Usuń pieniądze",
    kind: "action",
    fields: [
      ["amount", "Kwota", "10"]
    ]
  },
  gamemode: {
    title: "Zmień gamemode",
    kind: "action",
    fields: [
      ["mode", "Tryb", "survival"]
    ]
  },
  give_xp: {
    title: "Daj XP",
    kind: "action",
    fields: [
      ["amount", "XP", "10"]
    ]
  },
  set_rank: {
    title: "Ustaw rangę gracza",
    kind: "action",
    fields: [
      ["rank", "Ranga", "VIP"]
    ]
  },
  add_points: {
    title: "Dodaj punkty",
    kind: "action",
    fields: [
      ["amount", "Punkty", "10"]
    ]
  },
  console_command: {
    title: "Wykonaj komendę jako konsola",
    kind: "action",
    fields: [
      ["command", "Komenda", "say Witaj %player%"]
    ]
  },
  teleport: {
    title: "Teleportuj gracza",
    kind: "action",
    fields: [
      ["x", "X", "0"],
      ["y", "Y", "0"],
      ["z", "Z", "0"]
    ]
  },
  effect: {
    title: "Nadaj efekt",
    kind: "action",
    fields: [
      ["effect", "Efekt", "speed"],
      ["duration", "Czas (sek.)", "10"],
      ["amplifier", "Poziom", "1"]
    ]
  },
  set_variable: {
    title: "Ustaw zmienną",
    kind: "action",
    fields: [
      ["name", "Nazwa", "coins"],
      ["value", "Wartość", "100"]
    ]
  },
  wait: {
    title: "Czekaj",
    kind: "other",
    fields: [
      ["time", "Czas (sek.)", "1"]
    ]
  },
  comment: {
    title: "Komentarz",
    kind: "other",
    fields: [
      ["text", "Tekst", "Mój skrypt"]
    ]
  },
  own_skript: {
    title: "Własny skrypt",
    kind: "other",
    fields: [
      ["text", "Twój skrypt","własny skrypt"]
    ]
  },
  own_command: {
    title: "Komenda",
    kind: "event",
    fields: [
      ["command", "Komęda","command"]
    ]
  }
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function addBlock(type, values = {}) {
  const def = definitions[type];
  if (!def) return;

  const block = {
    id: nextId++,
    type,
    values: {}
  };

  def.fields.forEach(([key,, defaultValue]) => {
    block.values[key] = values[key] ?? defaultValue;
  });

  blocks.push(block);
  render();
}

function moveDraggedBlocks(event, targetIndex) {
  const rawIds = event.dataTransfer.getData("text/block-ids");
  const singleId = Number(event.dataTransfer.getData("text/block-id"));
  const draggedIds = rawIds ? JSON.parse(rawIds) : [singleId];
  const draggedSet = new Set(draggedIds.map(Number));
  const moved = blocks.filter(block => draggedSet.has(block.id));
  if (!moved.length) return;

  const removedBeforeTarget = blocks
    .slice(0, targetIndex)
    .filter(block => draggedSet.has(block.id)).length;
  const remaining = blocks.filter(block => !draggedSet.has(block.id));
  const insertIndex = Math.max(0, Math.min(remaining.length, targetIndex - removedBeforeTarget));
  remaining.splice(insertIndex, 0, ...moved);
  blocks = remaining;
  render();
}

function render() {
  emptyState.style.display = blocks.length ? "none" : "block";

  workspace.querySelectorAll(".block, .drop-zone").forEach(e => e.remove());

  blocks.forEach((block, index) => {
    const def = definitions[block.type];
    const el = document.createElement("div");
    const startsChain = def.kind === "event";
    el.className = `block ${def.kind}${startsChain ? " chain-start" : ""}`;
    el.dataset.id = block.id;
    el.draggable = true;
    el.title = "Przeciągnij, aby przenieść bloczek";

    let fields = "";
    if (def.fields.length) {
      fields = `<div class="block-fields">`;
      for (const [key, label] of def.fields) {
        fields += `
          <label>
            ${esc(label)}
            <input data-key="${esc(key)}" value="${esc(block.values[key])}">
          </label>`;
      }
      fields += `</div>`;
    }

    el.innerHTML = `
      <button class="delete-block" title="Usuń">✕</button>
      <div class="block-title">${esc(def.title)}</div>
      ${fields}
    `;

    el.querySelector(".delete-block").onclick = () => {
      blocks = blocks.filter(b => b.id !== block.id);
      render();
    };

    el.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", () => {
        block.values[input.dataset.key] = input.value;
        generate();
      });
    });

    el.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/block-id", String(block.id));
      e.dataTransfer.setData("text/block-ids", JSON.stringify(blocks.slice(index).map(item => item.id)));
      e.dataTransfer.effectAllowed = "move";
      document.body.classList.add("dragging-block");
    });

    el.addEventListener("dragover", e => {
      if (!e.dataTransfer.types.includes("text/block-id")) return;
      e.preventDefault();
      el.classList.add("drop-target");
    });

    el.addEventListener("dragleave", () => el.classList.remove("drop-target"));

    el.addEventListener("drop", e => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("drop-target");
      const targetIndex = e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2 ? index : index + 1;
      moveDraggedBlocks(e, targetIndex);
    });

    el.addEventListener("dragend", () => {
      document.body.classList.remove("dragging-block");
      sidebar?.classList.remove("drag-target");
    });

    workspace.appendChild(el);

    const drop = document.createElement("div");
    drop.className = "drop-zone";
    drop.dataset.index = index + 1;
    addDropEvents(drop);
    workspace.appendChild(drop);
  });

  generate();
}

function addDropEvents(zone) {
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("active");
  });

  zone.addEventListener("dragleave", () => zone.classList.remove("active"));

  zone.addEventListener("drop", e => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove("active");

    const id = Number(e.dataTransfer.getData("text/block-id"));
    const paletteType = e.dataTransfer.getData("text/palette-type");
    const targetIndex = Number(zone.dataset.index);

    if (paletteType) {
      const def = definitions[paletteType];
      const newBlock = {
        id: nextId++,
        type: paletteType,
        values: {}
      };
      def.fields.forEach(([key,, defaultValue]) => newBlock.values[key] = defaultValue);
      blocks.splice(targetIndex, 0, newBlock);
      render();
      return;
    }

    if (!id) return;

    moveDraggedBlocks(e, targetIndex);
  });
}

document.querySelectorAll(".block-palette").forEach(palette => {
  let dragged = false;

  palette.addEventListener("dragstart", e => {
    dragged = true;
    e.dataTransfer.setData("text/palette-type", palette.dataset.type);
    e.dataTransfer.effectAllowed = "copy";
  });

  palette.addEventListener("dragend", () => {
    setTimeout(() => { dragged = false; }, 0);
  });

  // Clicking a palette item is a fallback for browsers where HTML5 drag/drop is unreliable.
  palette.addEventListener("click", () => {
    if (!dragged) addBlock(palette.dataset.type);
  });
});

workspace.addEventListener("dragover", e => e.preventDefault());

workspace.addEventListener("drop", e => {
  e.preventDefault();

  const paletteType = e.dataTransfer.getData("text/palette-type");
  if (paletteType) {
    addBlock(paletteType);
    return;
  }

  moveDraggedBlocks(e, blocks.length);
});

const sidebar = document.querySelector(".sidebar");
const trashDrop = document.getElementById("trashDrop");
trashDrop.addEventListener("dragover", event => {
  event.preventDefault();
  trashDrop.classList.add("active");
});
trashDrop.addEventListener("dragleave", () => trashDrop.classList.remove("active"));
trashDrop.addEventListener("drop", event => {
  event.preventDefault();
  event.stopPropagation();
  const id = Number(event.dataTransfer.getData("text/block-id"));
  if (id) {
    blocks = blocks.filter(block => block.id !== id);
    render();
  }
  trashDrop.classList.remove("active");
  document.body.classList.remove("dragging-block");
  sidebar.classList.remove("drag-target");
});

sidebar.addEventListener("dragover", event => {
  if (event.dataTransfer.types.includes("text/block-id")) {
    event.preventDefault();
    trashDrop.classList.add("active");
  }
});
sidebar.addEventListener("dragenter", event => {
  if (event.dataTransfer.types.includes("text/block-id")) {
    event.preventDefault();
    sidebar.classList.add("drag-target");
  }
});
sidebar.addEventListener("dragleave", event => {
  if (!sidebar.contains(event.relatedTarget)) {
    sidebar.classList.remove("drag-target");
    trashDrop.classList.remove("active");
  }
});

function generate() {
  let output = "";
  let indent = 0;

  const push = line => {
    output += "    ".repeat(indent) + line + "\n";
  };

  blocks.forEach(block => {
    const v = block.values;

    switch (block.type) {
      case "event_join":
        indent = 0;
        push("on join:");
        indent = 1;
        break;
      case "event_death":
        indent = 0;
        push("on death:");
        indent = 1;
        break;
      case "event_right_click":
        indent = 0;
        push("on right click:");
        indent = 1;
        break;
      case "event_chat":
        indent = 0;
        push("on chat:");
        indent = 1;
        break;

      case "if_tool":
        push(`if player's tool is ${clean(v.item, "diamond")}:`);
        indent++;
        break;
      case "if_world":
        push(`if world of player is "${clean(v.world, "world")}":`);
        indent++;
        break;
      case "if_message_contains":
        push(`if message contains "${clean(v.text, "text")}":`);
        indent++;
        break;
      case "if_permission":
        push(`if player has permission "${clean(v.permission, "plugin.admin")}":`);
        indent++;
        break;
      case "if_loop_permission":
        push(`if loop-player has permission "${clean(v.permission, "plugin.admin")}":`);
        indent++;
        break;

      case "send_message":
        push(`send "${clean(v.message, "&aWitaj!").replaceAll('"', '\\"')}" to player`);
        break;
      case "send_loop_message":
        push(`send "${clean(v.message, "Wiadomość").replaceAll('"', '\\"')}" to loop-player`);
        break;
        case "send_permission_message":
          push("loop all players:");
          indent++;
          push(`if loop-player has permission "${clean(v.permission, "plugin.admin")}":`);
          indent++;
          push(`send "${clean(v.message, "Wiadomość").replaceAll('"', '\\"')}" to loop-player`);
          indent -= 2;
          break;
      case "cancel_event":
        push("cancel event");
        break;
      case "give_item":
        push(`give ${clean(v.amount, "1")} ${clean(v.item, "diamond")} to player`);
        break;
      case "money":
        push(`execute console command "eco give %player% ${clean(v.amount, "10")}"`);
        break;
      case "remove_money":
        push(`execute console command "eco take %player% ${clean(v.amount, "10")}"`);
        break;
      case "gamemode":
        push(`set player's gamemode to ${clean(v.mode, "survival")}`);
        break;
      case "give_xp":
        push(`add ${clean(v.amount, "10")} to player's experience`);
        break;
      case "set_rank":
        push(`execute console command "lp user %player% parent set ${clean(v.rank, "VIP")}"`);
        break;
      case "add_points":
        push(`add ${clean(v.amount, "10")} to {points::%player%}`);
        break;
      case "console_command":
        push(`execute console command "${clean(v.command, "say Witaj").replaceAll('"', '\\"')}"`);
        break;
      case "teleport":
        push(`teleport player to world, ${clean(v.x, "0")}, ${clean(v.y, "0")}, ${clean(v.z, "0")}`);
        break;
      case "effect":
        push(`apply ${clean(v.effect, "speed")} to player for ${clean(v.duration, "10")} seconds with amplifier ${clean(v.amplifier, "1")}`);
        break;
      case "set_variable":
        push(`set {${clean(v.name, "coins")}} to ${clean(v.value, "100")}`);
        break;
      case "wait":
        push(`wait ${clean(v.time, "1")} seconds`);
        break;
      case "comment":
        push(`# ${clean(v.text, "Mój skrypt")}`);
        break;
      case "loop_players":
        push("loop all players:");
        indent++;
        break;
      case "own_skript":
        push(`${clean(v.text, "własny skrypt")}`)
        break;
      case "own_command":
        indent = 0;
        push(`command: /${clean(v.command, "command")}:`);
        indent = 1;
        break;
    }

    // A condition in this simple editor applies to following actions.
    // When another event begins, return to event indentation.
    if (block.type.startsWith("event_") || block.type === "own_command") {
      indent = 1;
    }
  });

  if (!output.trim()) {
    output = "# Przeciągnij klocki, aby wygenerować kod Skript";
  }

  codeEl.textContent = output.trimEnd();
  document.getElementById("status").textContent = "● GOTOWE";
}

function clean(v, fallback) {
  const value = String(v ?? "").trim();
  return value || fallback;
}

function clearAll() {
  blocks = [];
  render();
}

function example() {
  blocks = [];
  nextId = 1;

  addBlock("event_join");
  addBlock("send_message", { message: "&aWitaj na serwerze!" });
  addBlock("give_item", { item: "diamond", amount: "3" });
  addBlock("money", { amount: "10" });
}

const readyScripts = [
  {
    title: "Gotowe skrypty pojawią się wkrótce!",
    description: "Gotowe skrypty pojawią się wkrótce!",
//    blocks: [["event_join"], ["send_message", { message: "&aWitaj na serwerze!" }], ["give_item", { item: "diamond", amount: "3" }], ["money", { amount: "10" }]]
  }
];

function loadReadyScript(template) {
  nextId = 1;
  blocks = template.blocks.map(([type, values = {}]) => ({
    id: nextId++,
    type,
    values: { ...values }
  }));
  render();
  document.getElementById("templatesModal").hidden = true;
  showToast(`Załadowano: ${template.title}`);
}

function showReadyScripts() {
  const list = document.getElementById("templatesList");
  list.innerHTML = readyScripts.map((template, index) => `
    <button class="template-choice" data-template="${index}">
      <strong>${esc(template.title)}</strong>
      <span>${esc(template.description)}</span>
    </button>`).join("");
  list.querySelectorAll(".template-choice").forEach(choice => {
    choice.onclick = () => loadReadyScript(readyScripts[Number(choice.dataset.template)]);
  });
  document.getElementById("templatesModal").hidden = false;
}

function importSkript(source) {
  const imported = [];
  const addImported = (type, values = {}) => {
    const def = definitions[type];
    if (!def) return;
    if (type === "teleport" && values.location) {
      const coordinates = String(values.location).split(",").map(value => value.trim());
      values = {
        x: coordinates.at(-3) || "0",
        y: coordinates.at(-2) || "0",
        z: coordinates.at(-1) || "0"
      };
    }
    const block = { id: nextId++, type, values: {} };
    def.fields.forEach(([key,, defaultValue]) => {
      block.values[key] = values[key] ?? defaultValue;
    });
    imported.push(block);
  };

  try {
    const project = JSON.parse(source);
    if (Array.isArray(project.blocks)) {
      project.blocks.forEach(savedBlock => {
        if (!definitions[savedBlock.type]) return;
        addImported(savedBlock.type, savedBlock.values || {});
      });
      blocks = imported;
      render();
      hideLoading();
      showToast(`Zaimportowano ${imported.length} bloków projektu.`);
      return;
    }
  } catch {
    // The file is Skript text, so continue with line parsing.
  }

  source.split(/\r?\n/).forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) return;
    if (line === "on join:") return addImported("event_join");
    if (line === "on death:") return addImported("event_death");
    if (line === "on right click:") return addImported("event_right_click");
    if (line === "on chat:") return addImported("event_chat");
    if (line === "cancel event") return addImported("cancel_event");
    if (line === "loop all players:") return addImported("loop_players");

    let match = line.match(/^send "(.*)" to player$/);
    if (match) return addImported("send_message", { message: match[1].replaceAll('\\"', '"') });
    match = line.match(/^send "(.*)" to loop-player$/);
    if (match) return addImported("send_loop_message", { message: match[1].replaceAll('\\"', '"') });
    match = line.match(/^give (\S+) (\S+) to player$/);
    if (match) return addImported("give_item", { amount: match[1], item: match[2] });
    match = line.match(/^execute console command "eco give %player% (.+)"$/);
    if (match) return addImported("money", { amount: match[1] });
    match = line.match(/^execute console command "eco take %player% (.+)"$/);
    if (match) return addImported("remove_money", { amount: match[1] });
    match = line.match(/^execute console command "(.*)"$/);
    if (match) return addImported("console_command", { command: match[1].replaceAll('\\"', '"') });
    match = line.match(/^teleport player to (?:[^,]+,\s*)?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (match) return addImported("teleport", { x: match[1], y: match[2], z: match[3] });
    match = line.match(/^if player's tool is (.+):$/);
    if (match) return addImported("if_tool", { item: match[1] });
    match = line.match(/^if world of player is "(.+)":$/);
    if (match) return addImported("if_world", { world: match[1] });
    match = line.match(/^message contains (.+):$/);
    if (match) return addImported("if_message_contains", { text: match[1].replace(/^"|"$/g, "") });
    match = line.match(/^if player has permission "(.+)":$/);
    if (match) return addImported("if_permission", { permission: match[1] });
    match = line.match(/^loop-player has permission "(.+)":$/);
    if (match) return addImported("if_loop_permission", { permission: match[1] });
    match = line.match(/^set player's gamemode to (.+)$/);
    if (match) return addImported("gamemode", { mode: match[1] });
    match = line.match(/^add (.+) to player's experience$/);
    if (match) return addImported("give_xp", { amount: match[1] });
    match = line.match(/^execute console command "lp user %player% parent set (.+)"$/);
    if (match) return addImported("set_rank", { rank: match[1] });
    match = line.match(/^add (.+) to \{points::%player%\}$/);
    if (match) return addImported("add_points", { amount: match[1] });
    match = line.match(/^apply (\S+) to player for (\S+) seconds with amplifier (\S+)$/);
    if (match) return addImported("effect", { effect: match[1], duration: match[2], amplifier: match[3] });
    match = line.match(/^wait (.+) seconds$/);
    if (match) return addImported("wait", { time: match[1] });
    match = line.match(/^set \{(.+)\} to (.+)$/);
    if (match) return addImported("set_variable", { name: match[1], value: match[2] });
    match = line.match(/^#\s?(.*)$/);
    if (match) return addImported("comment", { text: match[1] });
    addImported("comment", { text: `${line}` });
    if (match) return addImported("own_skript", { text: match[1] });
    addImported("own_skript", { text: `${line}` });
    if (match) return addImported("own_command", { text: match[1] });
    addImported("own_command", { text: `command: /${line}` });
  });

  blocks = imported;
  render();
  hideLoading();
  showToast(`Zaimportowano ${imported.length} bloków.`);
}

function showOptions() {
  const list = document.getElementById("optionsList");
  list.innerHTML = Object.entries(definitions).map(([type, def]) => `
    <div class="option-row ${esc(def.kind)}" draggable="true" data-type="${esc(type)}" title="Przeciągnij do obszaru skryptu">
      <span class="option-dot"></span>
      <span>${esc(def.title)}</span>
    </div>`).join("");

  list.querySelectorAll(".option-row").forEach(option => {
    option.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/palette-type", option.dataset.type);
      event.dataTransfer.effectAllowed = "copy";
    });
    option.addEventListener("click", () => addBlock(option.dataset.type));
  });
  document.getElementById("optionsModal").hidden = false;
}

function saveProject() {
  localStorage.setItem("minecraft-blockcode-project", JSON.stringify({
    version: 1,
    blocks
  }));
  showToast("Projekt zapisany w przeglądarce.");
}

function loadProject() {
  try {
    const raw = localStorage.getItem("minecraft-blockcode-project");
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.blocks)) return false;
    blocks = data.blocks;
    nextId = Math.max(0, ...blocks.map(b => Number(b.id) || 0)) + 1;
    render();
    return true;
  } catch {
    return false;
  }
}

function exportSkript() {
  const content = codeEl.textContent;
  const blob = new Blob([content + "\n"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "moj-skrypt.sk";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Wyeksportowano moj-skrypt.sk");
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeEl.textContent);
    showToast("Kod skopiowany.");
  } catch {
    showToast("Nie udało się skopiować kodu.");
  }
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function showLoading(text) {
  document.getElementById("loadingText").textContent = text;
  document.getElementById("loadingOverlay").classList.add("visible");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("visible");
}

function updateWorkspaceZoom() {
  workspace.style.zoom = workspaceZoom;
}

workspace.addEventListener("wheel", event => {
  event.preventDefault();
  if (event.shiftKey) {
    workspaceShiftX -= event.deltaY;
    workspace.style.setProperty("--workspace-pan-x", `${workspaceShiftX}px`);
    return;
  }
  const direction = event.deltaY > 0 ? -0.1 : 0.1;
  workspaceZoom = Math.max(.6, Math.min(1.6, Number((workspaceZoom + direction).toFixed(1))));
  updateWorkspaceZoom();
}, { passive: false });

workspace.addEventListener("pointerdown", event => {
  if (event.button !== 0 || event.target !== workspace) return;
  isPanningWorkspace = true;
  panStartX = event.clientX;
  panStartY = event.clientY;
  panStartShiftX = workspaceShiftX;
  panStartShiftY = workspaceShiftY;
  workspace.classList.add("panning");
  workspace.setPointerCapture(event.pointerId);
});

workspace.addEventListener("pointermove", event => {
  if (!isPanningWorkspace) return;
  workspaceShiftX = panStartShiftX + event.clientX - panStartX;
  workspaceShiftY = panStartShiftY + event.clientY - panStartY;
  workspace.style.setProperty("--workspace-pan-x", `${workspaceShiftX}px`);
  workspace.style.setProperty("--workspace-pan-y", `${workspaceShiftY}px`);
  workspaceWrap.style.setProperty("--grid-pan-x", `${workspaceShiftX}px`);
  workspaceWrap.style.setProperty("--grid-pan-y", `${workspaceShiftY}px`);
});

const stopWorkspacePan = event => {
  if (!isPanningWorkspace) return;
  isPanningWorkspace = false;
  workspace.classList.remove("panning");
  if (workspace.hasPointerCapture(event.pointerId)) workspace.releasePointerCapture(event.pointerId);
};
workspace.addEventListener("pointerup", stopWorkspacePan);
workspace.addEventListener("pointercancel", stopWorkspacePan);

document.getElementById("clearBtn").onclick = clearAll;
document.getElementById("newBtn").onclick = () => {
  if (confirm("Usunąć aktualny projekt?")) clearAll();
};
document.getElementById("exampleBtn").onclick = example;
document.getElementById("saveBtn").onclick = saveProject;
document.getElementById("exportBtn").onclick = exportSkript;
document.getElementById("copyBtn").onclick = copyCode;
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
menuBtn.onclick = event => {
  event.stopImmediatePropagation();
  menu.hidden = !menu.hidden;
  menuBtn.setAttribute("aria-expanded", String(!menu.hidden));
};
document.addEventListener("click", event => {
  if (menu.contains(event.target) || event.target === menuBtn) return;
  menu.hidden = true;
  menuBtn.setAttribute("aria-expanded", "false");
});
const themeToggle = document.getElementById("themeToggle");
function setTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-theme", isLight);
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeToggle.querySelector(".theme-icon").textContent = isLight ? "☾" : "☀";
  themeToggle.querySelector(".theme-label").textContent = isLight ? "Tryb ciemny" : "Tryb jasny";
  localStorage.setItem("minecraft-blockcode-theme", isLight ? "light" : "dark");
}
themeToggle.onclick = () => {
  themeToggle.classList.remove("theme-pulse");
  void themeToggle.offsetWidth;
  themeToggle.classList.add("theme-pulse");
  document.body.classList.remove("theme-changing");
  void document.body.offsetWidth;
  document.body.classList.add("theme-changing");
  setTheme(document.body.classList.contains("light-theme") ? "dark" : "light");
  window.setTimeout(() => document.body.classList.remove("theme-changing"), 520);
};
setTheme(localStorage.getItem("minecraft-blockcode-theme") || "dark");
document.getElementById("importBtn").onclick = () => document.getElementById("importInput").click();
document.getElementById("importInput").onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;
  const startedAt = performance.now();
  showLoading("Ładowanie importowanego skryptu...");
  try {
    const source = await file.text();
    const remaining = 300 - (performance.now() - startedAt);
    if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
    importSkript(source);
  } catch {
    hideLoading();
    showToast("Nie udało się zaimportować pliku.");
  } finally {
    event.target.value = "";
  }
};
document.getElementById("templatesBtn").onclick = showReadyScripts;
document.getElementById("closeOptionsBtn").onclick = () => {
  document.getElementById("optionsModal").hidden = true;
};
document.getElementById("closeTemplatesBtn").onclick = () => {
  document.getElementById("templatesModal").hidden = true;
};
document.getElementById("optionsModal").onclick = event => {
  if (event.target.id === "optionsModal") event.currentTarget.hidden = true;
};

if (!loadProject()) {
  render();
} else {
  generate();
}

window.requestAnimationFrame(() => {
  window.setTimeout(hideLoading, 650);
});
// Electron desktop updates
const updateBtn = document.getElementById("updateBtn");
const aboutBtn = document.getElementById("aboutBtn");
const updateBadge = document.getElementById("updateBadge");

function desktopToast(text) {
  showToast(text);
}

if (window.electronAPI?.isDesktop) {
  updateBtn.onclick = async () => {
    updateBtn.disabled = true;
    updateBtn.textContent = "⟳ Sprawdzanie...";
    const result = await window.electronAPI.checkForUpdates();
    if (result?.status === "dev") desktopToast("Aktualizacje będą dostępne po zainstalowaniu aplikacji.");
    else if (result?.status === "error") desktopToast("Błąd aktualizacji: " + result.message);
  };

  aboutBtn.onclick = () => window.electronAPI.showAbout();

  window.electronAPI.onUpdateStatus(async data => {
    if (data.status === "checking") {
      updateBtn.disabled = true;
      updateBtn.textContent = "⟳ Sprawdzanie...";
    }
    if (data.status === "available") {
      updateBtn.disabled = false;
      updateBtn.textContent = "⬇ Pobierz aktualizację";
      updateBadge.hidden = false;
      updateBadge.innerHTML = `<strong>Nowa wersja ${esc(data.version)} jest dostępna.</strong><br><button id="downloadUpdateBtn">Pobierz aktualizację</button>`;
      document.getElementById("downloadUpdateBtn").onclick = async () => {
        updateBadge.innerHTML = "Pobieranie aktualizacji...";
        await window.electronAPI.downloadUpdate();
      };
    }
    if (data.status === "not-available") {
      updateBtn.disabled = false;
      updateBtn.textContent = "↻ Sprawdź aktualizacje";
      desktopToast("Masz najnowszą wersję BlockSkript.");
    }
    if (data.status === "downloading") {
      updateBadge.hidden = false;
      updateBadge.textContent = `Pobieranie aktualizacji: ${Math.round(data.percent || 0)}%`;
    }
    if (data.status === "downloaded") {
      updateBtn.disabled = false;
      updateBtn.textContent = "↻ Aktualizacja pobrana";
      updateBadge.hidden = false;
      updateBadge.innerHTML = `<strong>Aktualizacja ${esc(data.version)} jest gotowa.</strong><br><button id="installUpdateBtn">Uruchom ponownie i zainstaluj</button>`;
      document.getElementById("installUpdateBtn").onclick = () => window.electronAPI.installUpdate();
    }
    if (data.status === "error") {
      updateBtn.disabled = false;
      updateBtn.textContent = "↻ Sprawdź aktualizacje";
      desktopToast("Nie udało się sprawdzić aktualizacji.");
    }
  });

  window.electronAPI.onAppVersion(version => {
    document.title = `BlockSkript ${version}`;
  });
} else {
  updateBtn.onclick = () => showToast("Funkcja aktualizacji jest dostępna w aplikacji desktopowej.");
  aboutBtn.onclick = () => showToast("BlockSkript — kreator Skript");
}
