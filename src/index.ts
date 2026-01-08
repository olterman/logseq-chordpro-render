// <reference types="@logseq/libs" />
import ChordproJS from 'chordprojs';

let pollTimer: number | null = null;
const seenHashes = new Map<string, string>();

function log(...args: any[]) {
  console.log("🎵 [ChordPro]", ...args);
}

// simple content hash for change detection
function hash(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

// sanitize input:
// - remove [[chordpro]] tag
// - remove other [[links]]
// - remove {comment: ...} tags
// - trim
function sanitizeChordPro(input: string): string {
  return input
    .replace(/\[\[chordpro\]\]\s*\n?/gi, "")
    .replace(/\[\[[^\]]+\]\]/g, "")
    //.replace(/\{comment:[^}]*\}/gi, "")
    .trim();
}

async function detectAndRender(reason: string) {
  log("Detect triggered:", reason);

  const page = await logseq.Editor.getCurrentPage();
  if (!page || typeof page.uuid !== "string") return;

  const blocks = await logseq.Editor.getPageBlocksTree(page.uuid);
  if (!blocks) return;

  // recursively find first block containing [[chordpro]]
  function find(nodes: any[]): any | null {
    for (const b of nodes) {
      if (
        typeof b.content === "string" &&
        b.content.toLowerCase().includes("[[chordpro]]")
      ) {
        return b;
      }
      if (b.children?.length) {
        const found = find(b.children);
        if (found) return found;
      }
    }
    return null;
  }

  const block = find(blocks);
  if (!block || typeof block.uuid !== "string") return;

 
  const source = block.content
  const chordpro = ChordproJS();
  const contentHash = hash(source); 
  
  // skip if content unchanged
  if (seenHashes.get(block.uuid) === contentHash) return;
  seenHashes.set(block.uuid, contentHash);

  log("FOUND chordpro block:", block.uuid);
  log("Sanitized source:\n", source);

  let html; 
  try {
    // add a newline at the end to avoid JS-ChordPro parse errors
    const doc = sanitizeChordPro(source);
    //const style = "<head><style>.chord-line { color: #0066cc; font-weight: bold; } .title {color: #e06c75;  /* Pink for title */}</style></head>";
    html = chordpro.renderToHTML(doc);
    // After rendering
    // document.querySelectorAll('.chord-line').forEach(el => { el.style.color = '#0066cc';});

  } catch (err) {
    console.error("🎵 [ChordPro] Render error", err, { source });
    return;
  }

	// remove previously rendered HTML children
	try {
  		const children = await logseq.Editor.getBlockChildren(block.uuid);
  		for (const child of children ?? []) {
    		if (typeof child.content === "string" && child.content.startsWith("```html")) {
      			await logseq.Editor.removeBlock(child.uuid);
    		}
  		}
	} catch (err) {
  			console.warn("🎵 [ChordPro] Could not fetch children, skipping removal", err);
	}


  // insert rendered HTML
  await logseq.Editor.insertBlock(
    block.uuid,
    //`\`\`\`html\n${html}\n\`\`\``,
    `${html}\n`,
    //{ sibling: false }
  );

  log("Rendered successfully");
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = window.setInterval(() => {
    detectAndRender("poll");
  }, 1500);
}

async function main() {
  console.log("🎵 ChordPro renderer plugin loaded");

  setTimeout(() => detectAndRender("startup"), 800);

  logseq.App.onRouteChanged(() => {
    seenHashes.clear();
    detectAndRender("route-change");
  });

  startPolling();
}

logseq.ready(main);
