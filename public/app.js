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


/* =========================================================
   DEFINICJE KLOCKÓW
========================================================= */

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
        fields: [
            ["text", "Szukany tekst", ""]
        ]
    },

    if_permission: {
        title: "Jeśli gracz ma permisję",
        kind: "condition",
        fields: [
            ["permission", "Permisja", "plugin.admin"]
        ]
    },

    if_loop_permission: {
        title: "Jeśli gracz w pętli ma permisję",
        kind: "condition",
        fields: [
            ["permission", "Permisja", "plugin.admin"]
        ]
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
        fields: [
            ["message", "Wiadomość", "Wiadomość"]
        ]
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
            ["world", "Świat", "world"],
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
            ["text", "Twój skrypt", "własny skrypt"]
        ]
    },

    own_trigger: {
        title: "Trigger",
        kind: "other",
        fields: []
    },

    own_gui: {
        title: "GUI",
        kind: "other",
        fields: [
            ["rows", "Sloty (9-54)", "54"],
            ["name", "Nazwa GUI", "&a&lMoje GUI"]
        ]
    },

    own_command: {
        title: "Kiedy gracz wpisze komendę",
        kind: "event",
        fields: [
            ["command", "Komenda", "command"]
        ]
    }
};


/* =========================================================
   POMOCNICZE
========================================================= */

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
}

function clean(value, fallback = "") {
    const result = String(value ?? "").trim();
    return result || fallback;
}

function escapeSkriptText(value) {
    return clean(value).replaceAll('"', '\\"');
}


/* =========================================================
   DODAWANIE KLOCKA
========================================================= */

function createBlock(type, values = {}) {

    const def = definitions[type];

    if (!def) return null;

    const block = {
        id: nextId++,
        type,
        values: {}
    };

    def.fields.forEach(([key, , defaultValue]) => {
        block.values[key] =
            values[key] !== undefined
                ? values[key]
                : defaultValue;
    });

    return block;
}

function addBlock(type, values = {}) {

    const block = createBlock(type, values);

    if (!block) return;

    blocks.push(block);

    render();
}


/* =========================================================
   PRZENOSZENIE KLOCKÓW
========================================================= */

function getDraggedIds(event) {

    const rawIds =
        event.dataTransfer.getData("text/block-ids");

    if (rawIds) {

        try {
            return JSON.parse(rawIds).map(Number);
        } catch {
            return [];
        }
    }

    const singleId =
        Number(event.dataTransfer.getData("text/block-id"));

    return singleId ? [singleId] : [];
}

function moveDraggedBlocks(event, targetIndex) {

    const draggedIds = getDraggedIds(event);

    if (!draggedIds.length) return;

    const draggedSet =
        new Set(draggedIds);

    const moved =
        blocks.filter(block =>
            draggedSet.has(block.id)
        );

    if (!moved.length) return;

    const removedBeforeTarget =
        blocks
            .slice(0, targetIndex)
            .filter(block =>
                draggedSet.has(block.id)
            ).length;

    const remaining =
        blocks.filter(block =>
            !draggedSet.has(block.id)
        );

    const insertIndex =
        Math.max(
            0,
            Math.min(
                remaining.length,
                targetIndex - removedBeforeTarget
            )
        );

    remaining.splice(
        insertIndex,
        0,
        ...moved
    );

    blocks = remaining;

    render();
}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!workspace) return;

    if (emptyState) {
        emptyState.style.display =
            blocks.length ? "none" : "block";
    }

    workspace
        .querySelectorAll(".block, .drop-zone")
        .forEach(element => element.remove());

    blocks.forEach((block, index) => {

        const def = definitions[block.type];

        if (!def) return;

        const element =
            document.createElement("div");

        const startsChain =
            def.kind === "event";

        element.className =
            `block ${def.kind}${startsChain ? " chain-start" : ""}`;

        element.dataset.id =
            block.id;

        element.draggable = true;

        element.title =
            "Przeciągnij, aby przenieść bloczek";

        let fieldsHTML = "";

        if (def.fields.length) {

            fieldsHTML =
                `<div class="block-fields">`;

            for (const [key, label] of def.fields) {

                fieldsHTML += `
                    <label>
                        ${esc(label)}
                        <input
                            data-key="${esc(key)}"
                            value="${esc(block.values[key])}"
                        >
                    </label>
                `;
            }

            fieldsHTML +=
                `</div>`;
        }

        element.innerHTML = `
            <button
                class="delete-block"
                title="Usuń"
                type="button"
            >✕</button>

            <div class="block-title">
                ${esc(def.title)}
            </div>

            ${fieldsHTML}
        `;

        const deleteButton =
            element.querySelector(".delete-block");

        deleteButton.onclick = () => {

            blocks =
                blocks.filter(
                    b => b.id !== block.id
                );

            render();
        };

        element
            .querySelectorAll("input")
            .forEach(input => {

                input.addEventListener(
                    "input",
                    () => {

                        block.values[
                            input.dataset.key
                        ] = input.value;

                        generate();
                    }
                );
            });

        element.addEventListener(
            "dragstart",
            event => {

                event.dataTransfer.setData(
                    "text/block-id",
                    String(block.id)
                );

                event.dataTransfer.setData(
                    "text/block-ids",
                    JSON.stringify(
                        blocks
                            .slice(index)
                            .map(item => item.id)
                    )
                );

                event.dataTransfer.effectAllowed =
                    "move";

                document.body.classList.add(
                    "dragging-block"
                );
            }
        );

        element.addEventListener(
            "dragover",
            event => {

                if (
                    !event.dataTransfer.types
                        .includes("text/block-id")
                ) return;

                event.preventDefault();

                element.classList.add(
                    "drop-target"
                );
            }
        );

        element.addEventListener(
            "dragleave",
            () => {
                element.classList.remove(
                    "drop-target"
                );
            }
        );

        element.addEventListener(
            "drop",
            event => {

                event.preventDefault();
                event.stopPropagation();

                element.classList.remove(
                    "drop-target"
                );

                const rect =
                    element.getBoundingClientRect();

                const targetIndex =
                    event.clientY <
                    rect.top + rect.height / 2
                        ? index
                        : index + 1;

                moveDraggedBlocks(
                    event,
                    targetIndex
                );
            }
        );

        element.addEventListener(
            "dragend",
            () => {

                document.body.classList.remove(
                    "dragging-block"
                );

                if (sidebar) {
                    sidebar.classList.remove(
                        "drag-target"
                    );
                }
            }
        );

        workspace.appendChild(element);

        const drop =
            document.createElement("div");

        drop.className =
            "drop-zone";

        drop.dataset.index =
            index + 1;

        addDropEvents(drop);

        workspace.appendChild(drop);
    });

    generate();
}


/* =========================================================
   DROP ZONE
========================================================= */

function addDropEvents(zone) {

    zone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            zone.classList.add("active");
        }
    );

    zone.addEventListener(
        "dragleave",
        () => {

            zone.classList.remove(
                "active"
            );
        }
    );

    zone.addEventListener(
        "drop",
        event => {

            event.preventDefault();
            event.stopPropagation();

            zone.classList.remove(
                "active"
            );

            const paletteType =
                event.dataTransfer.getData(
                    "text/palette-type"
                );

            const targetIndex =
                Number(zone.dataset.index);

            if (paletteType) {

                const newBlock =
                    createBlock(paletteType);

                if (!newBlock) return;

                blocks.splice(
                    targetIndex,
                    0,
                    newBlock
                );

                render();

                return;
            }

            moveDraggedBlocks(
                event,
                targetIndex
            );
        }
    );
}


/* =========================================================
   PALETA
========================================================= */

document
    .querySelectorAll(".block-palette")
    .forEach(palette => {

        let dragged = false;

        palette.addEventListener(
            "dragstart",
            event => {

                dragged = true;

                event.dataTransfer.setData(
                    "text/palette-type",
                    palette.dataset.type
                );

                event.dataTransfer.effectAllowed =
                    "copy";
            }
        );

        palette.addEventListener(
            "dragend",
            () => {

                setTimeout(
                    () => {
                        dragged = false;
                    },
                    0
                );
            }
        );

        palette.addEventListener(
            "click",
            () => {

                if (!dragged) {
                    addBlock(
                        palette.dataset.type
                    );
                }
            }
        );
    });


workspace.addEventListener(
    "dragover",
    event => {
        event.preventDefault();
    }
);

workspace.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        const paletteType =
            event.dataTransfer.getData(
                "text/palette-type"
            );

        if (paletteType) {

            addBlock(paletteType);

            return;
        }

        moveDraggedBlocks(
            event,
            blocks.length
        );
    }
);


/* =========================================================
   USUWANIE
========================================================= */

const sidebar =
    document.querySelector(".sidebar");

const trashDrop =
    document.getElementById("trashDrop");

if (trashDrop) {

    trashDrop.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            trashDrop.classList.add(
                "active"
            );
        }
    );

    trashDrop.addEventListener(
        "dragleave",
        () => {

            trashDrop.classList.remove(
                "active"
            );
        }
    );

    trashDrop.addEventListener(
        "drop",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const ids =
                getDraggedIds(event);

            if (ids.length) {

                const idSet =
                    new Set(ids);

                blocks =
                    blocks.filter(
                        block =>
                            !idSet.has(block.id)
                    );

                render();
            }

            trashDrop.classList.remove(
                "active"
            );

            document.body.classList.remove(
                "dragging-block"
            );

            sidebar?.classList.remove(
                "drag-target"
            );
        }
    );
}

if (sidebar) {

    sidebar.addEventListener(
        "dragover",
        event => {

            if (
                event.dataTransfer.types
                    .includes("text/block-id")
            ) {

                event.preventDefault();

                trashDrop?.classList.add(
                    "active"
                );
            }
        }
    );

    sidebar.addEventListener(
        "dragenter",
        event => {

            if (
                event.dataTransfer.types
                    .includes("text/block-id")
            ) {

                event.preventDefault();

                sidebar.classList.add(
                    "drag-target"
                );
            }
        }
    );

    sidebar.addEventListener(
        "dragleave",
        event => {

            if (
                !sidebar.contains(
                    event.relatedTarget
                )
            ) {

                sidebar.classList.remove(
                    "drag-target"
                );

                trashDrop?.classList.remove(
                    "active"
                );
            }
        }
    );
}


/* =========================================================
   GENEROWANIE SKRIPT
========================================================= */

function generate() {

    let output = "";
    let indent = 0;

    const push = line => {

        output +=
            "    ".repeat(Math.max(0, indent)) +
            line +
            "\n";
    };

    blocks.forEach(block => {

        const v = block.values || {};

        switch (block.type) {

            /* ================= EVENTS ================= */

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


            case "own_command":

                indent = 0;

                push(
                    `command /${clean(
                        v.command,
                        "command"
                    )}:`
                );

                indent = 1;

                break;


            /* ================= CONDITIONS ================= */

            case "if_tool":

                push(
                    `if player's tool is ${clean(
                        v.item,
                        "diamond"
                    )}:`
                );

                indent++;

                break;


            case "if_world":

                push(
                    `if world of player is "${escapeSkriptText(
                        v.world,
                        "world"
                    )}":`
                );

                indent++;

                break;


            case "if_message_contains":

                push(
                    `if message contains "${escapeSkriptText(
                        v.text,
                        "text"
                    )}":`
                );

                indent++;

                break;


            case "if_permission":

                push(
                    `if player has permission "${escapeSkriptText(
                        v.permission,
                        "plugin.admin"
                    )}":`
                );

                indent++;

                break;


            case "if_loop_permission":

                push(
                    `if loop-player has permission "${escapeSkriptText(
                        v.permission,
                        "plugin.admin"
                    )}":`
                );

                indent++;

                break;


            /* ================= ACTIONS ================= */

            case "send_message":

                push(
                    `send "${escapeSkriptText(
                        v.message,
                        "&aWitaj!"
                    )}" to player`
                );

                break;


            case "send_loop_message":

                push(
                    `send "${escapeSkriptText(
                        v.message,
                        "Wiadomość"
                    )}" to loop-player`
                );

                break;


            case "send_permission_message":

                push("loop all players:");

                indent++;

                push(
                    `if loop-player has permission "${escapeSkriptText(
                        v.permission,
                        "plugin.admin"
                    )}":`
                );

                indent++;

                push(
                    `send "${escapeSkriptText(
                        v.message,
                        "Wiadomość"
                    )}" to loop-player`
                );

                indent -= 2;

                break;


            case "cancel_event":

                push("cancel event");

                break;


            case "give_item":

                push(
                    `give ${clean(
                        v.amount,
                        "1"
                    )} ${clean(
                        v.item,
                        "diamond"
                    )} to player`
                );

                break;


            case "money":

                push(
                    `execute console command "eco give %player% ${clean(
                        v.amount,
                        "10"
                    )}"`
                );

                break;


            case "remove_money":

                push(
                    `execute console command "eco take %player% ${clean(
                        v.amount,
                        "10"
                    )}"`
                );

                break;


            case "gamemode":

                push(
                    `set player's gamemode to ${clean(
                        v.mode,
                        "survival"
                    )}`
                );

                break;


            case "give_xp":

                push(
                    `add ${clean(
                        v.amount,
                        "10"
                    )} to player's experience`
                );

                break;


            case "set_rank":

                push(
                    `execute console command "lp user %player% parent set ${clean(
                        v.rank,
                        "VIP"
                    )}"`
                );

                break;


            case "add_points":

                push(
                    `add ${clean(
                        v.amount,
                        "10"
                    )} to {points::%player%}`
                );

                break;


            case "console_command":

                push(
                    `execute console command "${escapeSkriptText(
                        v.command,
                        "say Witaj"
                    )}"`
                );

                break;


            case "teleport": {

                const world =
                    clean(v.world, "world");

                const x =
                    clean(v.x, "0");

                const y =
                    clean(v.y, "0");

                const z =
                    clean(v.z, "0");

                push(
                    `teleport player to location(${x}, ${y}, ${z}, "${escapeSkriptText(world)}")`
                );

                break;
            }


            case "effect":

                push(
                    `apply ${clean(
                        v.effect,
                        "speed"
                    )} to player for ${clean(
                        v.duration,
                        "10"
                    )} seconds with amplifier ${clean(
                        v.amplifier,
                        "1"
                    )}`
                );

                break;


            case "set_variable":

                push(
                    `set {${clean(
                        v.name,
                        "coins"
                    )}} to ${clean(
                        v.value,
                        "100"
                    )}`
                );

                break;


            /* ================= OTHER ================= */

            case "loop_players":

                push(
                    "loop all players:"
                );

                indent++;

                break;


            case "wait":

                push(
                    `wait ${clean(
                        v.time,
                        "1"
                    )} seconds`
                );

                break;


            case "comment":

                push(
                    `# ${clean(
                        v.text,
                        "Mój skrypt"
                    )}`
                );

                break;


            case "own_skript": {

                const custom =
                    clean(
                        v.text,
                        "własny skrypt"
                    );

                custom
                    .split(/\r?\n/)
                    .forEach(line => {

                        if (line.trim()) {
                            push(line);
                        }
                    });

                break;
            }


            case "own_trigger":

                push("trigger:");

                indent++;

                break;


            case "own_gui": {

                let slots =
                    Number(
                        clean(
                            v.rows,
                            "54"
                        )
                    );

                if (!Number.isFinite(slots)) {
                    slots = 54;
                }

                slots =
                    Math.max(
                        9,
                        Math.min(
                            54,
                            Math.round(slots / 9) * 9
                        )
                    );

                const rows =
                    slots / 9;

                const rowText =
                    rows === 1
                        ? "row"
                        : "rows";

                const name =
                    escapeSkriptText(
                        v.name,
                        "&a&lMoje GUI"
                    );

                push(
                    `open chest inventory with ${rows} ${rowText} named "${name}" to player`
                );

                break;
            }
        }

        /*
         * Każdy event rozpoczyna nową sekcję.
         */
        if (
            block.type.startsWith("event_")
        ) {
            indent = 1;
        }

        if (
            block.type === "own_command"
        ) {
            indent = 1;
        }
    });

    if (!output.trim()) {

        output =
            "# Przeciągnij klocki, aby wygenerować kod Skript";
    }

    codeEl.textContent =
        output.trimEnd();

    const status =
        document.getElementById("status");

    if (status) {
        status.textContent =
            "● GOTOWE";
    }
}


/* =========================================================
   CZYSZCZENIE
========================================================= */

function clearAll() {

    blocks = [];

    render();
}


/* =========================================================
   PRZYKŁAD
========================================================= */

function example() {

    blocks = [];

    nextId = 1;

    addBlock("event_join");

    addBlock(
        "send_message",
        {
            message:
                "&aWitaj na serwerze!"
        }
    );

    addBlock(
        "give_item",
        {
            item: "diamond",
            amount: "3"
        }
    );

    addBlock(
        "money",
        {
            amount: "10"
        }
    );
}


/* =========================================================
   GOTOWE SKRYPTY
========================================================= */

const readyScripts = [
    {
        title: "Witaj po wejściu",
        description:
            "Wysyła wiadomość graczowi po dołączeniu.",
        blocks: [
            [
                "event_join"
            ],
            [
                "send_message",
                {
                    message:
                        "&aWitaj na serwerze!"
                }
            ]
        ]
    },
    { title: "Antyspam",
        description:
            "Blokuje spam na czacie. Gracz bez permisji chat.admin może pisać raz na 5 sekund.",
        blocks: [
            [
                "event_chat"
            ],
            [
                "own_skript",
                {
                    text:
                        `if player has permission "chat.admin": stop`
                }
            ],
            [
                "own_skript",
                {
                    text:
                        `if {cooldown::%player%} is set: if ((unix timestamp of now) - {cooldown::%player%}) < 5: send "nie możesz jeszcze pisać, zaczekaj jeszcze %((unix timestamp of now) - {cooldown::%player%})% sekund" else: set {cooldown::%player%} to unix timestamp of now cancel event send "&6%player% &8> &7%message%" to all players`
                }
            ],
            [
                "own_skript",
                {
                    text:
                        `else: set {cooldown::%player%} to unix timestamp of now cancel event send "&6%player% &8> &7%message%" to all players`
                }
            ]
        ]
    }
];


function loadReadyScript(template) {

    nextId = 1;

    blocks =
        (template.blocks || [])
            .map(
                ([type, values = {}]) =>
                    createBlock(
                        type,
                        values
                    )
            )
            .filter(Boolean);

    render();

    const modal =
        document.getElementById(
            "templatesModal"
        );

    if (modal) {
        modal.hidden = true;
    }

    showToast(
        `Załadowano: ${template.title}`
    );
}


function showReadyScripts() {

    const list =
        document.getElementById(
            "templatesList"
        );

    if (!list) return;

    list.innerHTML =
        readyScripts
            .map(
                (template, index) => `
                    <button
                        class="template-choice"
                        data-template="${index}"
                        type="button"
                    >
                        <strong>
                            ${esc(template.title)}
                        </strong>

                        <span>
                            ${esc(template.description)}
                        </span>
                    </button>
                `
            )
            .join("");

    list
        .querySelectorAll(
            ".template-choice"
        )
        .forEach(choice => {

            choice.onclick = () => {

                loadReadyScript(
                    readyScripts[
                        Number(
                            choice.dataset.template
                        )
                    ]
                );
            };
        });

    document.getElementById(
        "templatesModal"
    ).hidden = false;
}


/* =========================================================
   IMPORT SKRIPT
========================================================= */

function importSkript(source) {

    const imported = [];

    const addImported =
        (type, values = {}) => {

            const block =
                createBlock(
                    type,
                    values
                );

            if (block) {
                imported.push(block);
            }
        };

    /*
     * Najpierw sprawdzamy JSON projektu.
     */
    try {

        const project =
            JSON.parse(source);

        if (
            project &&
            Array.isArray(project.blocks)
        ) {

            project.blocks.forEach(
                savedBlock => {

                    if (
                        definitions[
                            savedBlock.type
                        ]
                    ) {

                        addImported(
                            savedBlock.type,
                            savedBlock.values || {}
                        );
                    }
                }
            );

            blocks = imported;

            nextId =
                Math.max(
                    0,
                    ...blocks.map(
                        b =>
                            Number(b.id) || 0
                    )
                ) + 1;

            render();

            hideLoading();

            showToast(
                `Zaimportowano ${imported.length} bloków projektu.`
            );

            return;
        }

    } catch {
        // To nie JSON - próbujemy jako .sk
    }


    /*
     * Parser Skript.
     */
    source
        .split(/\r?\n/)
        .forEach(rawLine => {

            const line =
                rawLine.trim();

            if (!line) return;


            if (line === "on join:") {

                addImported(
                    "event_join"
                );

                return;
            }


            if (line === "on death:") {

                addImported(
                    "event_death"
                );

                return;
            }


            if (
                line ===
                "on right click:"
            ) {

                addImported(
                    "event_right_click"
                );

                return;
            }


            if (line === "on chat:") {

                addImported(
                    "event_chat"
                );

                return;
            }


            let match;


            match =
                line.match(
                    /^command \/([^\s:]+):$/
                );

            if (match) {

                addImported(
                    "own_command",
                    {
                        command: match[1]
                    }
                );

                return;
            }


            if (
                line ===
                "cancel event"
            ) {

                addImported(
                    "cancel_event"
                );

                return;
            }


            if (
                line ===
                "loop all players:"
            ) {

                addImported(
                    "loop_players"
                );

                return;
            }


            match =
                line.match(
                    /^send "(.*)" to player$/
                );

            if (match) {

                addImported(
                    "send_message",
                    {
                        message:
                            match[1]
                                .replaceAll(
                                    '\\"',
                                    '"'
                                )
                    }
                );

                return;
            }


            match =
                line.match(
                    /^send "(.*)" to loop-player$/
                );

            if (match) {

                addImported(
                    "send_loop_message",
                    {
                        message:
                            match[1]
                                .replaceAll(
                                    '\\"',
                                    '"'
                                )
                    }
                );

                return;
            }


            match =
                line.match(
                    /^give (\S+) (\S+) to player$/
                );

            if (match) {

                addImported(
                    "give_item",
                    {
                        amount: match[1],
                        item: match[2]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^execute console command "eco give %player% (.+)"$/
                );

            if (match) {

                addImported(
                    "money",
                    {
                        amount: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^execute console command "eco take %player% (.+)"$/
                );

            if (match) {

                addImported(
                    "remove_money",
                    {
                        amount: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^execute console command "(.*)"$/
                );

            if (match) {

                addImported(
                    "console_command",
                    {
                        command:
                            match[1]
                                .replaceAll(
                                    '\\"',
                                    '"'
                                )
                    }
                );

                return;
            }


            match =
                line.match(
                    /^teleport player to location\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*"([^"]+)"\)$/
                );

            if (match) {

                addImported(
                    "teleport",
                    {
                        x: match[1],
                        y: match[2],
                        z: match[3],
                        world: match[4]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^if player's tool is (.+):$/
                );

            if (match) {

                addImported(
                    "if_tool",
                    {
                        item: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^if world of player is "(.+)":$/
                );

            if (match) {

                addImported(
                    "if_world",
                    {
                        world: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^if message contains "(.+)":$/
                );

            if (match) {

                addImported(
                    "if_message_contains",
                    {
                        text: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^if player has permission "(.+)":$/
                );

            if (match) {

                addImported(
                    "if_permission",
                    {
                        permission: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^if loop-player has permission "(.+)":$/
                );

            if (match) {

                addImported(
                    "if_loop_permission",
                    {
                        permission: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^set player's gamemode to (.+)$/
                );

            if (match) {

                addImported(
                    "gamemode",
                    {
                        mode: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^add (.+) to player's experience$/
                );

            if (match) {

                addImported(
                    "give_xp",
                    {
                        amount: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^execute console command "lp user %player% parent set (.+)"$/
                );

            if (match) {

                addImported(
                    "set_rank",
                    {
                        rank: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^add (.+) to \{points::%player%\}$/
                );

            if (match) {

                addImported(
                    "add_points",
                    {
                        amount: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^apply (\S+) to player for (\S+) seconds with amplifier (\S+)$/
                );

            if (match) {

                addImported(
                    "effect",
                    {
                        effect: match[1],
                        duration: match[2],
                        amplifier: match[3]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^wait (.+) seconds$/
                );

            if (match) {

                addImported(
                    "wait",
                    {
                        time: match[1]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^set \{(.+)\} to (.+)$/
                );

            if (match) {

                addImported(
                    "set_variable",
                    {
                        name: match[1],
                        value: match[2]
                    }
                );

                return;
            }


            match =
                line.match(
                    /^#\s?(.*)$/
                );

            if (match) {

                addImported(
                    "comment",
                    {
                        text: match[1]
                    }
                );

                return;
            }


            /*
             * Nieznana linia -> własny Skript.
             */
            addImported(
                "own_skript",
                {
                    text: line
                }
            );
        });


    blocks = imported;

    nextId =
        Math.max(
            0,
            ...blocks.map(
                b => Number(b.id) || 0
            )
        ) + 1;

    render();

    hideLoading();

    showToast(
        `Zaimportowano ${imported.length} bloków.`
    );
}


/* =========================================================
   OPCJE
========================================================= */

function showOptions() {

    const list =
        document.getElementById(
            "optionsList"
        );

    if (!list) return;

    list.innerHTML =
        Object.entries(definitions)
            .map(
                ([type, def]) => `
                    <div
                        class="option-row ${esc(def.kind)}"
                        draggable="true"
                        data-type="${esc(type)}"
                        title="Przeciągnij do obszaru skryptu"
                    >
                        <span class="option-dot"></span>
                        <span>
                            ${esc(def.title)}
                        </span>
                    </div>
                `
            )
            .join("");

    list
        .querySelectorAll(
            ".option-row"
        )
        .forEach(option => {

            option.addEventListener(
                "dragstart",
                event => {

                    event.dataTransfer.setData(
                        "text/palette-type",
                        option.dataset.type
                    );

                    event.dataTransfer.effectAllowed =
                        "copy";
                }
            );

            option.addEventListener(
                "click",
                () => {

                    addBlock(
                        option.dataset.type
                    );
                }
            );
        });

    document.getElementById(
        "optionsModal"
    ).hidden = false;
}


/* =========================================================
   ZAPIS PROJEKTU
========================================================= */

function saveProject() {

    localStorage.setItem(
        "minecraft-blockcode-project",
        JSON.stringify(
            {
                version: 1,
                blocks
            }
        )
    );

    showToast(
        "Projekt zapisany w przeglądarce."
    );
}


function loadProject() {

    try {

        const raw =
            localStorage.getItem(
                "minecraft-blockcode-project"
            );

        if (!raw) return false;

        const data =
            JSON.parse(raw);

        if (
            !data ||
            !Array.isArray(data.blocks)
        ) {
            return false;
        }

        blocks =
            data.blocks
                .map(saved =>
                    createBlock(
                        saved.type,
                        saved.values || {}
                    )
                )
                .filter(Boolean);

        nextId =
            Math.max(
                0,
                ...blocks.map(
                    b => Number(b.id) || 0
                )
            ) + 1;

        render();

        return true;

    } catch {

        return false;
    }
}


/* =========================================================
   EKSPORT
========================================================= */

function exportSkript() {

    const content =
        codeEl.textContent;

    const blob =
        new Blob(
            [
                content + "\n"
            ],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "moj-skrypt.sk";

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

    showToast(
        "Wyeksportowano moj-skrypt.sk"
    );
}


async function copyCode() {

    try {

        await navigator.clipboard.writeText(
            codeEl.textContent
        );

        showToast(
            "Kod skopiowany."
        );

    } catch {

        showToast(
            "Nie udało się skopiować kodu."
        );
    }
}


/* =========================================================
   TOAST / LOADING
========================================================= */

function showToast(text) {

    if (!toast) return;

    toast.textContent = text;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(
            () =>
                toast.classList.remove(
                    "show"
                ),
            2200
        );
}


function showLoading(text) {

    const textElement =
        document.getElementById(
            "loadingText"
        );

    const overlay =
        document.getElementById(
            "loadingOverlay"
        );

    if (textElement) {
        textElement.textContent = text;
    }

    overlay?.classList.add(
        "visible"
    );
}


function hideLoading() {

    document
        .getElementById(
            "loadingOverlay"
        )
        ?.classList.remove(
            "visible"
        );
}


/* =========================================================
   ZOOM
========================================================= */

function updateWorkspaceZoom() {

    workspace.style.zoom =
        workspaceZoom;
}


workspace.addEventListener(
    "wheel",
    event => {

        event.preventDefault();

        if (event.shiftKey) {

            workspaceShiftX -=
                event.deltaY;

            workspace.style.setProperty(
                "--workspace-pan-x",
                `${workspaceShiftX}px`
            );

            return;
        }

        const direction =
            event.deltaY > 0
                ? -0.1
                : 0.1;

        workspaceZoom =
            Math.max(
                0.6,
                Math.min(
                    1.6,
                    Number(
                        (
                            workspaceZoom +
                            direction
                        ).toFixed(1)
                    )
                )
            );

        updateWorkspaceZoom();
    },
    {
        passive: false
    }
);


/* =========================================================
   PAN WORKSPACE
========================================================= */

workspace.addEventListener(
    "pointerdown",
    event => {

        if (
            event.button !== 0 ||
            event.target !== workspace
        ) return;

        isPanningWorkspace =
            true;

        panStartX =
            event.clientX;

        panStartY =
            event.clientY;

        panStartShiftX =
            workspaceShiftX;

        panStartShiftY =
            workspaceShiftY;

        workspace.classList.add(
            "panning"
        );

        workspace.setPointerCapture(
            event.pointerId
        );
    }
);


workspace.addEventListener(
    "pointermove",
    event => {

        if (!isPanningWorkspace) return;

        workspaceShiftX =
            panStartShiftX +
            event.clientX -
            panStartX;

        workspaceShiftY =
            panStartShiftY +
            event.clientY -
            panStartY;

        workspace.style.setProperty(
            "--workspace-pan-x",
            `${workspaceShiftX}px`
        );

        workspace.style.setProperty(
            "--workspace-pan-y",
            `${workspaceShiftY}px`
        );

        workspaceWrap?.style.setProperty(
            "--grid-pan-x",
            `${workspaceShiftX}px`
        );

        workspaceWrap?.style.setProperty(
            "--grid-pan-y",
            `${workspaceShiftY}px`
        );
    }
);


const stopWorkspacePan =
    event => {

        if (!isPanningWorkspace) return;

        isPanningWorkspace =
            false;

        workspace.classList.remove(
            "panning"
        );

        if (
            workspace.hasPointerCapture(
                event.pointerId
            )
        ) {

            workspace.releasePointerCapture(
                event.pointerId
            );
        }
    };


workspace.addEventListener(
    "pointerup",
    stopWorkspacePan
);

workspace.addEventListener(
    "pointercancel",
    stopWorkspacePan
);


/* =========================================================
   PRZYCISKI
========================================================= */

document.getElementById(
    "clearBtn"
)?.addEventListener(
    "click",
    clearAll
);


document.getElementById(
    "newBtn"
)?.addEventListener(
    "click",
    () => {

        if (
            confirm(
                "Usunąć aktualny projekt?"
            )
        ) {
            clearAll();
        }
    }
);


document.getElementById(
    "exampleBtn"
)?.addEventListener(
    "click",
    example
);


document.getElementById(
    "saveBtn"
)?.addEventListener(
    "click",
    saveProject
);


document.getElementById(
    "exportBtn"
)?.addEventListener(
    "click",
    exportSkript
);


document.getElementById(
    "copyBtn"
)?.addEventListener(
    "click",
    copyCode
);


/* =========================================================
   MENU
========================================================= */

const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const menu =
    document.getElementById(
        "menu"
    );

if (menuBtn && menu) {

    menuBtn.onclick =
        event => {

            event.stopImmediatePropagation();

            menu.hidden =
                !menu.hidden;

            menuBtn.setAttribute(
                "aria-expanded",
                String(!menu.hidden)
            );
        };


    document.addEventListener(
        "click",
        event => {

            if (
                menu.contains(
                    event.target
                ) ||
                event.target === menuBtn
            ) {
                return;
            }

            menu.hidden = true;

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    );
}


/* =========================================================
   MOTYW
========================================================= */

const themeToggle =
    document.getElementById(
        "themeToggle"
    );


function setTheme(theme) {

    if (!themeToggle) return;

    const isLight =
        theme === "light";

    document.body.classList.toggle(
        "light-theme",
        isLight
    );

    themeToggle.setAttribute(
        "aria-pressed",
        String(isLight)
    );

    const icon =
        themeToggle.querySelector(
            ".theme-icon"
        );

    const label =
        themeToggle.querySelector(
            ".theme-label"
        );

    if (icon) {
        icon.textContent =
            isLight ? "☾" : "☀";
    }

    if (label) {
        label.textContent =
            isLight
                ? "Tryb ciemny"
                : "Tryb jasny";
    }

    localStorage.setItem(
        "minecraft-blockcode-theme",
        isLight ? "light" : "dark"
    );
}


if (themeToggle) {

    themeToggle.onclick =
        () => {

            themeToggle.classList.remove(
                "theme-pulse"
            );

            void themeToggle.offsetWidth;

            themeToggle.classList.add(
                "theme-pulse"
            );

            document.body.classList.remove(
                "theme-changing"
            );

            void document.body.offsetWidth;

            document.body.classList.add(
                "theme-changing"
            );

            setTheme(
                document.body.classList.contains(
                    "light-theme"
                )
                    ? "dark"
                    : "light"
            );

            window.setTimeout(
                () => {

                    document.body.classList.remove(
                        "theme-changing"
                    );
                },
                520
            );
        };

    setTheme(
        localStorage.getItem(
            "minecraft-blockcode-theme"
        ) || "dark"
    );
}


/* =========================================================
   IMPORT PRZYCISK
========================================================= */

const importBtn =
    document.getElementById(
        "importBtn"
    );

const importInput =
    document.getElementById(
        "importInput"
    );

if (importBtn && importInput) {

    importBtn.onclick =
        () => importInput.click();

    importInput.onchange =
        async event => {

            const file =
                event.target.files[0];

            if (!file) return;

            const startedAt =
                performance.now();

            showLoading(
                "Ładowanie importowanego skryptu..."
            );

            try {

                const source =
                    await file.text();

                const remaining =
                    300 -
                    (
                        performance.now() -
                        startedAt
                    );

                if (remaining > 0) {

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                remaining
                            )
                    );
                }

                importSkript(source);

            } catch {

                hideLoading();

                showToast(
                    "Nie udało się zaimportować pliku."
                );

            } finally {

                event.target.value = "";
            }
        };
}


/* =========================================================
   MODALE
========================================================= */

document.getElementById(
    "templatesBtn"
)?.addEventListener(
    "click",
    showReadyScripts
);


document.getElementById(
    "closeOptionsBtn"
)?.addEventListener(
    "click",
    () => {

        document.getElementById(
            "optionsModal"
        ).hidden = true;
    }
);


document.getElementById(
    "closeTemplatesBtn"
)?.addEventListener(
    "click",
    () => {

        document.getElementById(
            "templatesModal"
        ).hidden = true;
    }
);


document.getElementById(
    "optionsModal"
)?.addEventListener(
    "click",
    event => {

        if (
            event.target.id ===
            "optionsModal"
        ) {

            event.currentTarget.hidden =
                true;
        }
    }
);


/* =========================================================
   START
========================================================= */

const startupLoading =
    document.getElementById("startupLoading");

const startupStatusElement =
    document.getElementById("startupStatus");

function startupStatus(text) {
    if (startupStatusElement) {
        startupStatusElement.textContent = text;
    }
}

async function startBlockSkript() {

    // Pokaż ekran ładowania
    startupLoading?.classList.add("visible");

    startupStatus("Uruchamianie BlockSkript...");

    await new Promise(resolve =>
        setTimeout(resolve, 500)
    );

    startupStatus("Ładowanie edytora...");

    await new Promise(resolve =>
        setTimeout(resolve, 500)
    );

    if (!loadProject()) {
        render();
    } else {
        generate();
    }

    startupStatus("Przygotowywanie interfejsu...");

    await new Promise(resolve =>
        setTimeout(resolve, 700)
    );

    startupStatus("Gotowe!");

    await new Promise(resolve =>
        setTimeout(resolve, 500)
    );

    // Ukryj ekran
    startupLoading?.classList.remove("visible");
}

startBlockSkript();


/* =========================================================
   ELECTRON UPDATE
========================================================= */

const updateBtn =
    document.getElementById(
        "updateBtn"
    );

const aboutBtn =
    document.getElementById(
        "aboutBtn"
    );

const updateBadge =
    document.getElementById(
        "updateBadge"
    );


function desktopToast(text) {
    showToast(text);
}


if (window.electronAPI?.isDesktop) {

    updateBtn?.addEventListener(
        "click",
        async () => {

            updateBtn.disabled = true;

            updateBtn.textContent =
                "⟳ Sprawdzanie...";

            try {

                const result =
                    await window.electronAPI
                        .checkForUpdates();

                if (
                    result?.status ===
                    "dev"
                ) {

                    desktopToast(
                        "Aktualizacje będą dostępne po zainstalowaniu aplikacji."
                    );
                }

                else if (
                    result?.status ===
                    "error"
                ) {

                    desktopToast(
                        "Błąd aktualizacji: " +
                        result.message
                    );
                }

            } catch (error) {

                desktopToast(
                    "Nie udało się sprawdzić aktualizacji."
                );

                updateBtn.disabled =
                    false;

                updateBtn.textContent =
                    "↻ Sprawdź aktualizacje";
            }
        }
    );


    aboutBtn?.addEventListener(
        "click",
        () =>
            window.electronAPI.showAbout()
    );


    window.electronAPI.onUpdateStatus(
        async data => {

            if (
                data.status ===
                "checking"
            ) {

                updateBtn.disabled =
                    true;

                updateBtn.textContent =
                    "⟳ Sprawdzanie...";
            }


            if (
                data.status ===
                "available"
            ) {

                updateBtn.disabled =
                    false;

                updateBtn.textContent =
                    "⬇ Pobierz aktualizację";

                updateBadge.hidden =
                    false;

                updateBadge.innerHTML = `
                    <strong>
                        Nowa wersja ${esc(data.version)}
                        jest dostępna.
                    </strong>
                    <br>
                    <button
                        id="downloadUpdateBtn"
                        type="button"
                    >
                        Pobierz aktualizację
                    </button>
                `;

                document
                    .getElementById(
                        "downloadUpdateBtn"
                    )
                    ?.addEventListener(
                        "click",
                        async () => {

                            updateBadge.textContent =
                                "Pobieranie aktualizacji...";

                            await window
                                .electronAPI
                                .downloadUpdate();
                        }
                    );
            }


            if (
                data.status ===
                "not-available"
            ) {

                updateBtn.disabled =
                    false;

                updateBtn.textContent =
                    "↻ Sprawdź aktualizacje";

                desktopToast(
                    "Masz najnowszą wersję BlockSkript."
                );
            }


            if (
                data.status ===
                "downloading"
            ) {

                updateBadge.hidden =
                    false;

                updateBadge.textContent =
                    `Pobieranie aktualizacji: ${
                        Math.round(
                            data.percent || 0
                        )
                    }%`;
            }


            if (
                data.status ===
                "downloaded"
            ) {

                updateBtn.disabled =
                    false;

                updateBtn.textContent =
                    "↻ Aktualizacja pobrana";

                updateBadge.hidden =
                    false;

                updateBadge.innerHTML = `
                    <strong>
                        Aktualizacja ${esc(data.version)}
                        jest gotowa.
                    </strong>
                    <br>
                    <button
                        id="installUpdateBtn"
                        type="button"
                    >
                        Uruchom ponownie i zainstaluj
                    </button>
                `;

                document
                    .getElementById(
                        "installUpdateBtn"
                    )
                    ?.addEventListener(
                        "click",
                        () =>
                            window.electronAPI
                                .installUpdate()
                    );
            }


            if (
                data.status ===
                "error"
            ) {

                updateBtn.disabled =
                    false;

                updateBtn.textContent =
                    "↻ Sprawdź aktualizacje";

                desktopToast(
                    "Nie udało się sprawdzić aktualizacji."
                );
            }
        }
    );


    window.electronAPI.onAppVersion(
        version => {

            document.title =
                `BlockSkript ${version}`;
        }
    );

} else {

    updateBtn?.addEventListener(
        "click",
        () => {

            showToast(
                "Funkcja aktualizacji jest dostępna w aplikacji desktopowej."
            );
        }
    );


    aboutBtn?.addEventListener(
        "click",
        () => {

            showToast(
                "BlockSkript — kreator Skript"
            );
        }
    );
}